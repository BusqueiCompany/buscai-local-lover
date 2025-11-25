# Mudanças propostas - Patches iniciais

Estes patches iniciais contém:
1) `docs/FIRESTORE_SCHEMA.md` - documento com o modelo recomendado de Firestore.
2) `scripts/import_off.js` - script Node.js para importar CSV e consultar Open Food Facts.
3) `src/hooks/useEntregador.ts` - hook React para tracking do entregador (online/offline, geo watch).
4) `prompts/LOVABLE_PROMPTS.md` - prompts prontos para colar no Lovable para reestruturar o Admin e importadores.
5) `README_PATCH.md` - este arquivo (sumário).

Instruções:
- Faça commit destes arquivos em uma branch `feat/init-patches` e abra um PR.
- Testes e aplicação: revise as variáveis de ambiente (FIREBASE_SERVICE_ACCOUNT_JSON, MAPBOX_KEY).
- Posso gerar os commits PR automaticamente se autorizar acesso ao repo ou instruir-me para criar um patch unificado (.diff).
