-- Fix vector store ID type mismatch
-- The app currently uses Mongo-style string IDs for users/documents,
-- but the initial vector store schema expected UUIDs.
--
-- This migration changes `user_id` and `document_id` to TEXT and updates
-- the `match_documents` RPC to accept a TEXT `filter_user_id`.

begin;

alter table if exists public.document_chunks
  alter column document_id type text using document_id::text,
  alter column user_id type text using user_id::text;

-- Drop the old signature (uuid filter) if it exists
drop function if exists public.match_documents(vector(768), float, int, uuid);

create or replace function public.match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_user_id text
)
returns table (
  id uuid,
  document_id text,
  user_id text,
  content text,
  metadata jsonb,
  chunk_index int,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.user_id,
    document_chunks.content,
    document_chunks.metadata,
    document_chunks.chunk_index,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from public.document_chunks
  where 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
    and document_chunks.user_id = filter_user_id
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;

commit;
