-- Separate private blog content. Existing content and finance tables are untouched.
begin;
create table if not exists ledger.blog_images (
  id uuid primary key default extensions.gen_random_uuid(),
  mime_type text not null check (mime_type = 'image/webp'),
  bytes bytea not null check (octet_length(bytes) between 1 and 2097152),
  created_at timestamptz not null default now()
);
create table if not exists ledger.blog_posts (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null default '' check (length(title) <= 200),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 160),
  status text not null default 'draft' check (status in ('draft', 'published')),
  post_date date not null default current_date,
  cover_image text not null default '',
  html text not null default '' check (length(html) <= 200000),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists blog_posts_date_idx on ledger.blog_posts (post_date desc, created_at desc);
alter table ledger.blog_images enable row level security;
alter table ledger.blog_posts enable row level security;
revoke all on ledger.blog_images, ledger.blog_posts from anon, authenticated;
commit;
