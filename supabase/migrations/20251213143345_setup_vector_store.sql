-- Enable pgvector extension
create extension if not exists vector;

-- Create document_chunks table
create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null, -- Reference to documents table (if exists) or just ID
  user_id uuid not null, -- Critical for security
  content text not null,
  metadata jsonb,
  chunk_index integer,
  embedding vector(768), -- Dimensions for Gemini text-embedding-004
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for faster queries
create index on document_chunks using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Create RPC function for similarity search with user filtering
create or replace function match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_user_id uuid
)
returns table (
  id uuid,
  document_id uuid,
  user_id uuid,
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
  from document_chunks
  where 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  and document_chunks.user_id = filter_user_id -- SECURE: Force filter by user_id
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;
