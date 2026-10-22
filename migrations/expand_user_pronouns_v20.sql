-- Allow people to save self-described pronouns while keeping the preference optional.
ALTER TABLE usuarios
MODIFY COLUMN pronome VARCHAR(80) NULL;
