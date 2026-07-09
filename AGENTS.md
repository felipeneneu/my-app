<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:cep-autofill -->
# CEP Auto-fill via ViaCEP

When a form has a CEP (Brazilian postal code) field, implement auto-fill of address fields using the public ViaCEP API (`https://viacep.com.br/ws/{cep}/json/`).

## Pattern
- Use `useCallback` for the fetch function + `useEffect` with debounce (600ms)
- Strip non-digits with `raw.replace(/\D/g, "")`, only fetch when length === 8
- Map response fields: `logradouro` → street, `bairro` → neighborhood, `localidade` → city, `uf` → state
- Show a spinner (`Loader2` with `animate-spin`) inside the CEP input while loading
- Set `readOnly` on auto-filled fields during loading to prevent user edits while fetching

## Example
Implemented in `app/adm/company/client.tsx`.
<!-- END:cep-autofill -->
