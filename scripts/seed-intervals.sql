/**
 * Direct SQL Script to Update Procedure Return Intervals
 * Run this in your PostgreSQL database
 */

-- Update Toxina (120 days)
UPDATE procedure_types SET return_interval = 120 WHERE LOWER(name) LIKE '%toxina%botul%';

-- Update Preenchimentos (365 days / 1 year)
UPDATE procedure_types SET return_interval = 365 WHERE 
    LOWER(name) IN ('8point', 'comissura', 'lábio', 'malar', 'mandíbula', 'mento', 'pré jowls', 'nariz', 'olheira', 'sulco naso', 'têmpora', 'glabela', 'marionete')
    OR LOWER(name) LIKE 'preenchimento%';

-- Update Fios (180 days)
UPDATE procedure_types SET return_interval = 180 WHERE LOWER(name) LIKE '%fio%pdo%';

-- Update Bioestimuladores (90 days)
UPDATE procedure_types SET return_interval = 90 WHERE 
    LOWER(name) LIKE '%bioestimulador%'
    OR LOWER(name) IN ('pdrn', 'exossomos', 'lavieen', 'hipro');

-- Update Corporal (30 days)
UPDATE procedure_types SET return_interval = 30 WHERE 
    LOWER(name) LIKE '%glúteo%max%'
    OR LOWER(name) LIKE '%gordura%localizada%'
    OR LOWER(name) LIKE '%protocolo%';

-- Update Tratamentos (30 days)
UPDATE procedure_types SET return_interval = 30 WHERE 
    LOWER(name) LIKE '%microagulhamento%'
    OR LOWER(name) LIKE '%hialuronidase%'
    OR LOWER(name) LIKE '%endolaser%';

-- Update Transplante e Cirurgias (0 - no recall)
UPDATE procedure_types SET return_interval = 0 WHERE 
    LOWER(name) LIKE '%tp1%' OR LOWER(name) LIKE '%tp2%' OR LOWER(name) LIKE '%tp3%'
    OR LOWER(name) IN ('alectomia', 'bichectomia', 'brow lift', 'lip lift', 'slim tip', 'lipo de papada', 'blefaro', 'rinoplastia');

-- Verify the update
SELECT name, return_interval FROM procedure_types ORDER BY name;
