
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

async function checkSchema() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from("interviews")
    .select("*")
    .limit(1)

  if (error) {
    console.error("Column check error:", error.message)
  } else {
    console.log("Columns found:", Object.keys(data[0] || {}))
  }
}

checkSchema()
