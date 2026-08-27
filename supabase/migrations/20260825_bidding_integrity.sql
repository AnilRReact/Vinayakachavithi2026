-- Atomic auction operations: run after 20260824_phase2_auth.sql.
create or replace function public.record_bid(item_id uuid, bidder_name text, bid_amount numeric)
returns public.bid_items language plpgsql security definer set search_path = public as $$
declare item public.bid_items;
begin
  if not public.is_money_team() then raise exception 'Only the money team can record bids'; end if;
  select * into item from public.bid_items where id = item_id and status = 'open' for update;
  if item.id is null then raise exception 'Auction item is not open'; end if;
  if bidder_name is null or length(trim(bidder_name)) = 0 or bid_amount <= coalesce(item.current_bid, item.starting_bid) then
    raise exception 'Bid must be higher than the current bid';
  end if;
  insert into public.bid_history (bid_item_id, bidder, amount) values (item_id, trim(bidder_name), bid_amount);
  update public.bid_items set current_bid = bid_amount, current_bidder = trim(bidder_name) where id = item_id returning * into item;
  return item;
end; $$;
grant execute on function public.record_bid(uuid, text, numeric) to authenticated;

create or replace function public.close_bid(item_id uuid)
returns public.bid_items language plpgsql security definer set search_path = public as $$
declare item public.bid_items;
begin
  if not public.is_money_team() then raise exception 'Only the money team can close bidding'; end if;
  update public.bid_items set status = 'closed' where id = item_id and status = 'open' and current_bidder is not null and current_bid is not null returning * into item;
  if item.id is null then raise exception 'Open auction item must have a winning bid'; end if;
  return item;
end; $$;
grant execute on function public.close_bid(uuid) to authenticated;