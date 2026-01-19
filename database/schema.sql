CREATE TABLE patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  cpf VARCHAR(14),
  birth_date DATE,
  phone VARCHAR(20),
  email VARCHAR(255),
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE professionals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  specialty VARCHAR(100),
  is_admin BOOLEAN DEFAULT FALSE,
  photo_url TEXT,
  agenda_config JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT,
  professional_id INT,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  status ENUM('agendado', 'confirmado', 'aguardando', 'em_atendimento', 'finalizado', 'faltou', 'cancelado') DEFAULT 'agendado',
  type ENUM('consulta', 'retorno', 'compromisso') DEFAULT 'consulta',
  notes TEXT,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (professional_id) REFERENCES professionals(id)
);

CREATE TABLE leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  origin VARCHAR(50),
  status ENUM('novo', 'em_atendimento', 'convertido', 'perdido') DEFAULT 'novo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT,
  sender_id INT,
  content TEXT,
  file_urls JSON,
  read_by JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user'
);
