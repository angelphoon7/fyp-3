import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

// Primary key column name per table
const TABLE_PK: Record<string, string> = {
  users: "phone",
  checkins: "id",
  messages: "id",
  kai_app_state: "key",
};

function collection(tableName: string) {
  const pkCol = TABLE_PK[tableName] ?? "id";
  const isKV = tableName === "kai_app_state";

  function doc(docId: string) {
    return {
      async get() {
        const { data } = await supabase
          .from(tableName)
          .select("*")
          .eq(pkCol, docId)
          .maybeSingle();

        const docData = data
          ? isKV
            ? { value: data.value, updatedAt: data.updated_at }
            : (data.data ?? data)
          : undefined;

        return { exists: !!data, data: () => docData, id: docId };
      },

      async set(newData: Record<string, any>, options?: { merge?: boolean }) {
        if (isKV) {
          await supabase.from(tableName).upsert(
            { key: docId, value: newData.value ?? newData, updated_at: new Date().toISOString() },
            { onConflict: "key" }
          );
        } else if (options?.merge) {
          const { data: existing } = await supabase
            .from(tableName).select("data").eq(pkCol, docId).maybeSingle();
          const merged = { ...(existing?.data ?? {}), ...newData };
          await supabase.from(tableName).upsert(
            { [pkCol]: docId, data: merged },
            { onConflict: pkCol }
          );
        } else {
          await supabase.from(tableName).upsert(
            { [pkCol]: docId, data: newData },
            { onConflict: pkCol }
          );
        }
      },

      async update(patch: Record<string, any>) {
        const { data: existing } = await supabase
          .from(tableName).select("data").eq(pkCol, docId).maybeSingle();
        const merged = { ...(existing?.data ?? {}), ...patch };
        await supabase.from(tableName).update({ data: merged }).eq(pkCol, docId);
      },
    };
  }

  return {
    doc,

    async add(newData: Record<string, any>) {
      const { data } = await supabase
        .from(tableName).insert({ data: newData }).select("id").single();
      return { id: data?.id ?? "" };
    },

    where(field: string, _op: string, value: any) {
      return {
        async get() {
          const { data } = await supabase.from(tableName).select("*");
          const filtered = (data ?? []).filter(row => {
            const d = row.data ?? row;
            return d[field] === value;
          });
          return {
            docs: filtered.map(row => ({
              data: () => row.data ?? row,
              id: row[pkCol] ?? row.id,
            })),
          };
        },
      };
    },
  };
}

export const db = { collection };
