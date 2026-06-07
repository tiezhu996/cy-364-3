CREATE TABLE IF NOT EXISTS operation_records (
  id SERIAL PRIMARY KEY,
  module_name VARCHAR(120) NOT NULL,
  owner_name VARCHAR(80) NOT NULL,
  status VARCHAR(40) NOT NULL,
  metric VARCHAR(40) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO operation_records (module_name, owner_name, status, metric)
VALUES ('多门店SKU统一管理', '运营组', 'ready', '100%');

CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(40) NOT NULL UNIQUE,
  address VARCHAR(255),
  manager VARCHAR(80),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO stores (name, code, address, manager) VALUES
('朝阳区旗舰店', 'ST001', '北京市朝阳区建国路88号', '张三'),
('海淀区中关村店', 'ST002', '北京市海淀区中关村大街1号', '李四'),
('西城区金融街店', 'ST003', '北京市西城区金融街15号', '王五'),
('东城区王府井店', 'ST004', '北京市东城区王府井大街201号', '赵六'),
('丰台区科技园店', 'ST005', '北京市丰台区科技园区10号', '孙七');

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  sku VARCHAR(40) NOT NULL UNIQUE,
  barcode VARCHAR(80),
  category VARCHAR(80),
  unit VARCHAR(20) NOT NULL,
  price DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO products (name, sku, barcode, category, unit, price) VALUES
('农夫山泉500ml', 'SKU001', '6921168509256', '饮料', '瓶', 2.00),
('康师傅红烧牛肉面', 'SKU002', '6920202888883', '方便食品', '桶', 5.50),
('伊利纯牛奶250ml', 'SKU003', '6907992500881', '乳制品', '盒', 3.80),
('乐事原味薯片', 'SKU004', '6924743915814', '休闲食品', '袋', 8.90),
('可口可乐330ml', 'SKU005', '6901939621103', '饮料', '罐', 2.50),
('金龙鱼调和油5L', 'SKU006', '6922266445555', '粮油', '桶', 79.90),
('维达抽纸3层120抽', 'SKU007', '6901236341556', '日用品', '包', 12.90),
('蓝月亮洗衣液3kg', 'SKU008', '6920192912345', '洗涤用品', '瓶', 45.90);

CREATE TABLE IF NOT EXISTS inventory_checks (
  id SERIAL PRIMARY KEY,
  check_no VARCHAR(40) NOT NULL UNIQUE,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  period VARCHAR(40) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'pending',
  operator VARCHAR(80),
  remark VARCHAR(255),
  total_profit DECIMAL(12,2) DEFAULT 0,
  total_loss DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

INSERT INTO inventory_checks (check_no, store_id, period, status, operator, remark) VALUES
('PD20260601001', 1, '2026年5月', 'completed', '张三', '5月底例行盘点'),
('PD20260601002', 2, '2026年5月', 'completed', '李四', '5月底例行盘点'),
('PD20260601003', 3, '2026年5月', 'pending', '王五', '5月底待盘点'),
('PD20260601004', 4, '2026年5月', 'pending', '赵六', '5月底待盘点'),
('PD20260601005', 5, '2026年5月', 'pending', '孙七', '5月底待盘点');

CREATE TABLE IF NOT EXISTS inventory_check_items (
  id SERIAL PRIMARY KEY,
  check_id INTEGER NOT NULL REFERENCES inventory_checks(id),
  product_id INTEGER NOT NULL,
  product_name VARCHAR(120) NOT NULL,
  product_sku VARCHAR(40) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  price DECIMAL(10,2) DEFAULT 0,
  system_stock INTEGER NOT NULL DEFAULT 0,
  actual_stock INTEGER NOT NULL DEFAULT 0,
  difference INTEGER NOT NULL DEFAULT 0,
  difference_value DECIMAL(12,2) DEFAULT 0,
  difference_type VARCHAR(20),
  remark VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO inventory_check_items (check_id, product_id, product_name, product_sku, unit, price, system_stock, actual_stock, difference, difference_value, difference_type) VALUES
(1, 1, '农夫山泉500ml', 'SKU001', '瓶', 2.00, 120, 115, -5, -10.00, 'loss'),
(1, 2, '康师傅红烧牛肉面', 'SKU002', '桶', 5.50, 80, 82, 2, 11.00, 'profit'),
(1, 3, '伊利纯牛奶250ml', 'SKU003', '盒', 3.80, 200, 200, 0, 0.00, 'normal'),
(1, 4, '乐事原味薯片', 'SKU004', '袋', 8.90, 60, 58, -2, -17.80, 'loss'),
(1, 5, '可口可乐330ml', 'SKU005', '罐', 2.50, 150, 150, 0, 0.00, 'normal'),
(2, 1, '农夫山泉500ml', 'SKU001', '瓶', 2.00, 100, 100, 0, 0.00, 'normal'),
(2, 2, '康师傅红烧牛肉面', 'SKU002', '桶', 5.50, 90, 85, -5, -27.50, 'loss'),
(2, 3, '伊利纯牛奶250ml', 'SKU003', '盒', 3.80, 180, 185, 5, 19.00, 'profit'),
(2, 4, '乐事原味薯片', 'SKU004', '袋', 8.90, 70, 70, 0, 0.00, 'normal'),
(2, 5, '可口可乐330ml', 'SKU005', '罐', 2.50, 130, 128, -2, -5.00, 'loss');

INSERT INTO operation_records (module_name, owner_name, status, metric) VALUES
('门店月度盘点', '盘点组', 'processing', '2单待处理'),
('门店月度盘点', '盘点组', 'completed', '盈亏 +¥3.20'),
('门店月度盘点', '盘点组', 'completed', '盈亏 -¥13.50');
