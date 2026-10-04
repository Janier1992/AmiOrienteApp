-- Migration: Allow users to mark their own notifications as read
-- Date: 2026-10-04
-- user_notifications only had a SELECT policy. NotificationsTab.jsx
-- calls .update({ read: true }) to mark one/all notifications as read,
-- which was silently failing under RLS (no UPDATE policy existed, and
-- the calling code doesn't check the error).

CREATE POLICY "Users can update their own notifications"
    ON public.user_notifications FOR UPDATE
    USING (auth.uid() = user_id);
