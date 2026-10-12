-- Пользователи
create table if not exists users (
  id           bigint primary key,              -- telegram_id
  username     text,
  first_name   text,
  avatar_url   text,
  phone_number text not null,                   -- случайный +7...
  balance_ton  numeric(18,4) default 100.0,     -- стартовый баланс
  is_admin     boolean default false,
  created_at   timestamptz default now()
);

-- Каталог подарков (реальные коллекции Telegram)
create table if not exists gift_catalog (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,          -- 'plush-pepe'
  name           text not null,                 -- 'Plush Pepe'
  rarity         text not null,                 -- common|rare|epic|legendary|mythic
  image_url      text not null,
  base_price_ton numeric(18,4) not null,
  drop_weight    int not null default 100       -- вес для рулетки кейса
);

-- Инвентарь пользователя
create table if not exists user_gifts (
  id          uuid primary key default gen_random_uuid(),
  user_id     bigint references users(id) on delete cascade,
  gift_id     uuid references gift_catalog(id),
  acquired_at timestamptz default now()
);

-- NFT-юзы и +888 номера
create table if not exists nft_usernames (
  id             uuid primary key default gen_random_uuid(),
  owner_id       bigint references users(id) on delete set null,
  type           text not null,                 -- 'username' | 'phone'
  value          text not null,                 -- '@monk' или '+79991234567'
  price_ton      numeric(18,4) default 0,
  is_listed      boolean default false,
  is_admin_added boolean default true,
  created_at     timestamptz default now()
);

-- История апгрейдов
create table if not exists upgrade_history (
  id           uuid primary key default gen_random_uuid(),
  user_id      bigint references users(id) on delete cascade,
  from_gift_id uuid,
  to_gift_id   uuid,
  chance       numeric(6,4),
  success      boolean,
  created_at   timestamptz default now()
);

-- Кейсы
create table if not exists cases (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  name       text not null,
  price_ton  numeric(18,4) default 0,
  is_free    boolean default false,
  image_url  text
);

-- Выпадения из кейсов: какие подарки и с каким весом
create table if not exists case_drops (
  case_id uuid references cases(id) on delete cascade,
  gift_id uuid references gift_catalog(id) on delete cascade,
  weight  int not null default 100,
  primary key (case_id, gift_id)
);

-- Индексы
create index on user_gifts(user_id);
create index on nft_usernames(owner_id);
create index on upgrade_history(user_id);
