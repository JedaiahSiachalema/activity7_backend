INSERT INTO records (title, category, description, status)
SELECT seed.title, seed.category, seed.description, seed.status
FROM (VALUES
  ('Understanding JavaScript functions', 'Programming', 'I need help understanding parameters, return values and function scope.', 'Pending'),
  ('Database normalization support', 'Databases', 'I would like assistance with first, second and third normal forms.', 'In progress'),
  ('Calculus differentiation question', 'Mathematics', 'I need guidance on applying the product and quotient rules.', 'Pending'),
  ('HTML forms and validation', 'Programming', 'I need help building accessible forms and validating user input.', 'Completed'),
  ('Introduction to probability', 'Mathematics', 'I would like support with conditional probability and distributions.', 'Pending'),
  ('SQL joins practice', 'Databases', 'I need an explanation of INNER JOIN and LEFT JOIN with examples.', 'In progress'),
  ('Object oriented programming concepts', 'Programming', 'I need help understanding classes, objects and inheritance.', 'Pending'),
  ('Relational database keys', 'Databases', 'I would like to understand primary keys and foreign keys.', 'Completed')
) AS seed(title, category, description, status)
WHERE NOT EXISTS (SELECT 1 FROM records);
