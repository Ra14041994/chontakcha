// Ma’lumotlar bazasi sxemasi. Har bir buyruq alohida bajariladi (Neon HTTP bitta so‘rovda bitta buyruq qabul qiladi).
// Pul qiymatlari so‘mda, butun son sifatida `double precision` ustunlarda saqlanadi (ikkala drayver ham JS number qaytaradi).
export const SCHEMA_VERSION = 1

export const SCHEMA: string[] = [
  `create table if not exists meta (k text primary key, v text not null)`,

  `create table if not exists users (
    id text primary key,
    phone text unique,
    tg_id text unique,
    tg_username text,
    name text not null default '',
    area text not null default 'chortoq',
    notify jsonb not null default '{"price":true,"messages":true,"bookings":true,"follows":true}'::jsonb,
    is_admin boolean not null default false,
    blocked boolean not null default false,
    created_at timestamptz not null default now(),
    last_seen timestamptz
  )`,

  `create table if not exists login_tokens (
    token text primary key,
    status text not null default 'pending',
    tg_id text,
    user_id text,
    polled boolean not null default false,
    linked boolean not null default false,
    next_path text,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists login_tokens_tg on login_tokens(tg_id, created_at desc)`,

  `create table if not exists businesses (
    id text primary key,
    owner_id text references users(id) on delete set null,
    name text not null,
    category text not null default '',
    phone text,
    address text not null default '',
    area text not null default 'chortoq',
    lat double precision not null,
    lng double precision not null,
    open_time text not null default '09:00',
    close_time text not null default '21:00',
    days text not null default '1234567',
    about text not null default '',
    logo_url text,
    color text not null default '#234685',
    delivery boolean not null default false,
    delivery_fee double precision,
    delivery_eta text,
    delivery_area text,
    is_sample boolean not null default false,
    status text not null default 'active',
    sub_until timestamptz,
    auto_renew boolean not null default true,
    pay_method text,
    created_at timestamptz not null default now()
  )`,
  `create unique index if not exists businesses_owner_uq on businesses(owner_id) where owner_id is not null`,

  `create table if not exists listings (
    id text primary key,
    business_id text not null references businesses(id) on delete cascade,
    kind text not null default 'product',
    title text not null,
    norm_title text not null,
    search_text text not null default '',
    category text not null default 'other',
    condition text,
    price double precision not null default 0,
    price_old double precision,
    unit text not null default 'so‘m',
    description text not null default '',
    specs jsonb not null default '[]'::jsonb,
    photos jsonb not null default '[]'::jsonb,
    available boolean not null default true,
    delivery boolean not null default false,
    delivery_fee double precision,
    delivery_eta text,
    delivery_area text,
    booking boolean not null default false,
    booking_cfg jsonb,
    status text not null default 'active',
    is_sample boolean not null default false,
    views integer not null default 0,
    price_checked_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`,
  `create index if not exists listings_business on listings(business_id)`,
  `create index if not exists listings_norm on listings(norm_title)`,

  `create table if not exists events (
    id serial primary key,
    business_id text not null,
    listing_id text,
    type text not null,
    user_id text,
    day text not null,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists events_business_day on events(business_id, day)`,

  `create table if not exists favorites (
    user_id text not null references users(id) on delete cascade,
    listing_id text not null references listings(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, listing_id)
  )`,

  `create table if not exists follows (
    user_id text not null references users(id) on delete cascade,
    business_id text not null references businesses(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, business_id)
  )`,

  `create table if not exists conversations (
    id text primary key,
    business_id text not null references businesses(id) on delete cascade,
    buyer_id text not null references users(id) on delete cascade,
    listing_id text references listings(id) on delete set null,
    last_text text not null default '',
    last_at timestamptz not null default now(),
    buyer_unread integer not null default 0,
    seller_unread integer not null default 0,
    created_at timestamptz not null default now(),
    unique (business_id, buyer_id)
  )`,

  `create table if not exists messages (
    id serial primary key,
    conversation_id text not null references conversations(id) on delete cascade,
    sender_id text,
    from_seller boolean not null default false,
    body text not null default '',
    listing_id text,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists messages_conv on messages(conversation_id, id)`,

  `create table if not exists bookings (
    id text primary key,
    listing_id text not null references listings(id) on delete cascade,
    business_id text not null references businesses(id) on delete cascade,
    user_id text not null references users(id) on delete cascade,
    day text not null,
    start_hour integer not null,
    hours integer not null default 1,
    room text,
    note text not null default '',
    price double precision not null default 0,
    status text not null default 'pending',
    created_at timestamptz not null default now()
  )`,
  `create index if not exists bookings_business_day on bookings(business_id, day)`,
  `create index if not exists bookings_user on bookings(user_id)`,

  `create table if not exists reviews (
    id text primary key,
    listing_id text references listings(id) on delete set null,
    business_id text not null references businesses(id) on delete cascade,
    user_id text not null references users(id) on delete cascade,
    booking_id text,
    rating integer not null,
    tags jsonb not null default '[]'::jsonb,
    body text not null default '',
    photo_url text,
    reply text,
    replied_at timestamptz,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists reviews_business on reviews(business_id)`,
  `create unique index if not exists reviews_user_listing on reviews(user_id, listing_id)`,

  `create table if not exists promotions (
    id text primary key,
    business_id text not null references businesses(id) on delete cascade,
    body text not null,
    listing_id text references listings(id) on delete set null,
    until text,
    reach integer not null default 0,
    created_at timestamptz not null default now()
  )`,

  `create table if not exists notifications (
    id serial primary key,
    user_id text not null references users(id) on delete cascade,
    type text not null,
    title text not null,
    body text not null default '',
    link text,
    image text,
    read boolean not null default false,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists notifications_user on notifications(user_id, id desc)`,

  `create table if not exists reports (
    id serial primary key,
    listing_id text references listings(id) on delete cascade,
    business_id text,
    user_id text,
    reason text not null,
    resolved boolean not null default false,
    created_at timestamptz not null default now()
  )`,

  `create table if not exists payments (
    id serial primary key,
    business_id text not null references businesses(id) on delete cascade,
    amount double precision not null default 0,
    months integer not null default 1,
    method text,
    note text,
    created_by text,
    created_at timestamptz not null default now()
  )`,
]
