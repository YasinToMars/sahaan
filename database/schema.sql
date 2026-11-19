-- Owner: Aberham Ketema Abebe
-- Requirements: all of them (the four tables the whole app uses)
-- What it does: creates the tables. Run it with:  npm run db:setup
-- (setup.js creates the "sahaan" database first, then runs this file inside it.)
--
-- How the tables link:
--   users 1 ──< restaurants      (an owner has many restaurants)
--   restaurants 1 ──< menu_items (a restaurant has many menu items)
--   restaurants 1 ──< reviews >── 1 users  (a review links one customer to one restaurant)
-- ON DELETE CASCADE: deleting a user or restaurant also deletes the rows that belong to it.

CREATE TABLE users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name     VARCHAR(60)  NOT NULL,
  email         VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,                -- "salt:hash", never the real password
  role          ENUM('customer', 'owner', 'admin') NOT NULL DEFAULT 'customer',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE restaurants (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_id      INT UNSIGNED NOT NULL,
  name          VARCHAR(100) NOT NULL,
  cuisine       VARCHAR(40)  NOT NULL,                -- one of CUISINES in config/lists.js
  location      VARCHAR(60)  NOT NULL,                -- one of LOCATIONS in config/lists.js
  price_level   TINYINT UNSIGNED NOT NULL,            -- 1 = $ Budget ... 4 = $$$$ Fine dining
  description   VARCHAR(500) NULL,
  opening_hours VARCHAR(100) NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_restaurants_cuisine (cuisine),
  INDEX idx_restaurants_location (location),
  CONSTRAINT fk_restaurants_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT chk_restaurants_price CHECK (price_level BETWEEN 1 AND 4)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE menu_items (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  restaurant_id INT UNSIGNED NOT NULL,
  name          VARCHAR(80)  NOT NULL,
  description   VARCHAR(200) NULL,
  price         DECIMAL(7, 2) NOT NULL,               -- in AED, e.g. 32.50
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_menu_items_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants (id) ON DELETE CASCADE,
  CONSTRAINT chk_menu_items_price CHECK (price BETWEEN 0.50 AND 9999.99)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE reviews (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  restaurant_id INT UNSIGNED NOT NULL,
  user_id       INT UNSIGNED NOT NULL,
  rating        TINYINT UNSIGNED NOT NULL,            -- 1 to 5 stars
  comment       VARCHAR(500) NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reviews_one_per_customer (restaurant_id, user_id), -- one review per customer per restaurant
  CONSTRAINT fk_reviews_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants (id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
