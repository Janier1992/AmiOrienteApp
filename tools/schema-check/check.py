#!/usr/bin/env python3
"""
Verificador de consultas Supabase: compara lo que el código pide/escribe con las
columnas reales de la base (tools/schema-check/schema.py).

Uso (desde la raíz del repo):   python3 tools/schema-check/check.py

Detecta: tablas inexistentes, columnas inexistentes en select/filtros/orden y en
insert/update con objeto literal. Es una revisión aproximada (no entiende
variables ni consultas armadas dinámicamente): sirve para encontrar desajustes
como `stores.lat` o `deliveries.assigned_at` antes de llegar a producción.

Para regenerar schema.py tras cambios en la base, ejecuta
docs/supabase/02_auditoria_esquema.sql y vuelca la sección "columnas".
"""
import os, re, glob, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from schema import SCHEMA
def split_top(s):
    out=[];d=0;cur=''
    for ch in s:
        if ch=='(':d+=1
        if ch==')':d-=1
        if ch==',' and d==0: out.append(cur);cur=''
        else: cur+=ch
    if cur.strip(): out.append(cur)
    return [x.strip() for x in out if x.strip()]
issues=[]
def check_select(table,sel,where):
    for part in split_top(sel):
        part=re.sub(r'\s+',' ',part)
        m=re.match(r'^(?:(\w+):)?(\w+)(?:!(\w+))?\s*\((.*)\)$',part)
        if m:
            alias,name,fk,inner=m.groups()
            # embebido: la tabla destino suele llamarse igual
            tgt=name if name in SCHEMA else None
            if tgt is None:
                issues.append((where,table,f"embebido '{name}' no es tabla conocida")); continue
            check_select(tgt,inner,where)
        else:
            col=part.split(':')[-1].strip()
            if col=='*' or col.startswith('count') : continue
            col=col.split('::')[0].strip()
            if re.match(r'^\w+$',col) and col not in SCHEMA[table]:
                issues.append((where,table,f"select columna inexistente '{col}'"))
for f in sorted(glob.glob('src/**/*.js*',recursive=True)):
    if '__tests__' in f: continue
    s=open(f,encoding='utf-8').read()
    for m in re.finditer(r"\.from\(\s*['\"](\w+)['\"]\s*\)",s):
        t=m.group(1)
        if t not in SCHEMA: issues.append((f,t,'TABLA inexistente')); continue
        # cadena: hasta ';' o 1200 chars
        end=s.find(';',m.end()); chain=s[m.end():end if end!=-1 else m.end()+1200]
        line=s[:m.start()].count('\n')+1
        where=f"{f}:{line}"
        for sm in re.finditer(r"\.select\(\s*(`[^`]*`|'[^']*'|\"[^\"]*\")",chain):
            check_select(t,sm.group(1)[1:-1],where)
        for fm in re.finditer(r"\.(eq|neq|in|gt|gte|lt|lte|ilike|like|is|not|order)\(\s*['\"](\w+)['\"]",chain):
            col=fm.group(2)
            if fm.group(1)=='not' : continue
            if col not in SCHEMA[t]: issues.append((where,t,f"filtro/orden por columna inexistente '{col}'"))
        for im in re.finditer(r"\.(insert|update|upsert)\(\s*\[?\s*\{",chain):
            i=im.end()-1; d=0; j=i
            while j<len(chain):
                if chain[j]=='{': d+=1
                elif chain[j]=='}':
                    d-=1
                    if d==0: break
                j+=1
            body=chain[i+1:j]
            # claves a profundidad 1
            dd=0;seg='';keys=[]
            for ch in body:
                if ch in '{[(':dd+=1
                if ch in '}])':dd-=1
                if ch==',' and dd==0: keys.append(seg);seg=''
                else: seg+=ch
            keys.append(seg)
            for k in keys:
                k=k.strip()
                if not k or k.startswith('...'): continue
                km=re.match(r"^['\"]?(\w+)['\"]?\s*(:|,|$)",k)
                if km:
                    c=km.group(1)
                    if c not in SCHEMA[t]: issues.append((where,t,f"{im.group(1)} con columna inexistente '{c}'"))
seen=set()
for w,t,msg in issues:
    key=(w,t,msg)
    if key in seen: continue
    seen.add(key); print(f"{w} [{t}] {msg}")
print(len(seen),'hallazgos')
