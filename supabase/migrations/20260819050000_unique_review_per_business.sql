-- OnePlace: prevent duplicate reviews per business per user.
alter table public.reviews
  add constraint reviews_one_per_business
  unique (business_id, reviewer_id);
