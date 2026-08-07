-- AXI 사용 가능 역할 (site_settings)
-- anonymous = 비로그인, 나머지는 profiles.role 과 동일

alter table public.site_settings
  add column if not exists axi_allowed_roles text[] not null
    default array['super_admin', 'sub_admin', 'team_lead', 'employee']::text[];

comment on column public.site_settings.axi_allowed_roles is
  'AXI를 사용할 수 있는 대상. anonymous(비로그인) 또는 profiles.role 값';
