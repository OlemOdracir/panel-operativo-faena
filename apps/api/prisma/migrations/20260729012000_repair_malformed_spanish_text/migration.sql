-- Repair the malformed replacement character observed in an existing demo work order.
-- Unicode escapes keep this migration independent from a terminal code page.
UPDATE work_orders
SET title = U&'Revisar vibraci\00F3n'
WHERE title = U&'Revisar vibraci\FFFDn';
