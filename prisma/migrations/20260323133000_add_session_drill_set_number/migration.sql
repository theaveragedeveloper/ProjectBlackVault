-- Add explicit set/attempt number for drills logged within a range session.
ALTER TABLE "SessionDrill" ADD COLUMN "setNumber" INTEGER NOT NULL DEFAULT 1;
