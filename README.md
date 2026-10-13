# SISTCS Leve (versão Supabase)

App de acompanhamento com dados na nuvem: alimentação com metas e "quanto falta", água, peso, medicamentos,
relatórios e uma configuração personalizada que estima suas metas diárias.

## Telas

- **Início:** resumo de hoje (calorias com anel de progresso, nutrientes, água, peso, doses) e atalho para configurar.
- **Exercícios:** diário de atividades, duração e estimativa aproximada de calorias gastas por MET e peso corporal. Requer a migration aditiva `supabase/migrations/20261012170000_exercise_entries.sql`. A migration ainda não foi aplicada em produção; não execute `db push` até reconciliar o histórico de migrations documentado em `docs/SUPABASE_MIGRATION_AUDIT_2026-10-12.md`.
- **Alimentação:** busca local de alimentos e preparações brasileiras, produtos embalados do Open Food Facts e referências USDA SR Legacy via TempoLife (priorizar registros com licença pública explícita e atribuição; nomes podem aparecer em inglês), leitura de código de barras pela câmera (Chrome/Android; nos outros navegadores, digite o número), lançamentos por refeição, favoritos, total do dia e **quanto falta (ou passou) para cada meta**; água com meta e copo. Os valores aproximados são identificados como estimativas.
- **Registros:** peso com gráfico, variação e progresso até o peso desejado.
- **Registros também tem Antes e depois:** envio de fotos (antes, durante, depois), comparação lado a lado com dias e variação de peso, e galeria.
- **Jejum:** protocolos 12:12 a 20:4 (ou 12 a 24 h), cronômetro com início e término, horas jejuadas, fase estimada, histórico, estatísticas e benefícios com avisos de saúde. Não é indicado para menores de 18 anos.
- **Medicamentos:** cadastro com horários e marcação das doses de cada dia.
- **Relatórios:** últimos 7, 14 ou 30 dias (calorias, água, peso, médias e dias dentro da meta).
- **Perfil:** foto de perfil (recortada em quadrado), dados pessoais, objetivo, estimativa de metas, metas manuais, exportar JSON, importar dados antigos, sair e apagar tudo.

## Configuração personalizada

No Perfil você informa sexo, data de nascimento, altura, nível de atividade, objetivo (perder, manter ou ganhar peso),
ritmo semanal e a distribuição de nutrientes (equilibrada, mais proteína ou menos carboidrato). Com o peso mais recente dos
Registros, o app calcula pela equação de Mifflin-St Jeor:

- gasto basal e gasto diário estimado;
- meta de calorias, com piso de 1.200 kcal (mulheres) e 1.500 kcal (homens) ao perder peso;
- proteínas, carboidratos, gorduras, fibras (14 g por 1.000 kcal) e água (35 ml por kg).

O botão "Usar como minhas metas" preenche os campos; você ajusta o que quiser e salva. O cálculo só vale para maiores de 18
anos e é uma estimativa geral, não orientação médica.

## PWA (app instalável)

- `public/manifest.webmanifest`: nome **SISTCS Leve**, ícones gerados da logo (comum e maskable), atalhos para Alimentos, Jejum e Peso.
- `public/sw.js`: service worker que guarda só os arquivos do app (abre rápido e abre sem internet). Dados de saúde, Supabase e Open Food Facts nunca são guardados nele.
- `src/pwa.tsx`: botão "Instalar app" (Perfil), aviso "nova versão disponível" e faixa de "sem internet".
- Só funciona na versão **publicada com HTTPS** (`npm run build` e hospedar `dist/`). Em `npm run dev` o service worker fica desligado.
- Sem internet o app abre, mas os dados vêm do Supabase: novos registros só são salvos quando a conexão voltar.
- Para trocar a logo, substitua os arquivos de `public/` (`icon-*.png`, `logo.webp`, `emblem.webp`, `favicon-*.png`, `apple-touch-icon.png`).
- Lembretes por notificação com o app fechado (push) ainda não existem: exigem um servidor (função do Supabase com chaves VAPID).

Para publicar em leve.sistcs.com (Cloudflare), veja `DEPLOY.md`: `npm run deploy`.

## Rodar

```bash
npm install
npm run dev        # desenvolvimento
npm run build      # gera dist/ (site estático, rotas por #)
```

As variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` são opcionais (veja `.env.example`); os valores do
projeto já são o padrão. A chave publicável pode ficar no front-end. Nunca coloque a chave `service_role` no projeto.

## Supabase

- Projeto `yzcmxdbnitturlbozvqu` (sa-east-1). Para recriar em outro projeto, rode `supabase/schema.sql` inteiro.
- Tabelas: `profiles`, `food_entries`, `favorite_foods`, `water_entries`, `weight_entries`, `medications`, `medication_logs`, `progress_photos`, `fasting_entries`,
  todas com RLS por usuário.
- Fotos: buckets privados `avatars` e `progress-photos` (5 MB, só imagens), com política por pasta do usuário. As imagens são
  reduzidas no navegador antes do envio e exibidas por links temporários de 1 hora.
- Login por e-mail e senha. Por padrão o Supabase exige confirmar o e-mail; para testar sem isso, desligue "Confirm email" em
  Authentication > Providers > Email.
- Dados antigos do navegador (`meu-progresso-total:local-data:v1`) podem ser importados pelo Perfil.

## Estrutura

- `src/calc.ts`: estimativa de metas.
- `src/data.ts`: tipos, cálculos e todas as chamadas ao Supabase.
- `src/session.tsx`: login, sessão e carregamento dos dados.
- `src/pages/`: Home, Food, Records (com BeforeAfter), Fasting, Medications, Reports, Profile.
- `src/foods-br.ts` e `src/foodsearch.tsx`: busca de alimentos e código de barras. A lista local é aproximada e digitada à mão (não é a tabela TACO oficial); o Open Food Facts é consultado direto do navegador e tem dados colaborativos.
- `src/foodsearch.tsx` e `src/foods-br.ts`: busca de alimentos, Open Food Facts e código de barras.
- `src/photos.tsx`: redução de imagem, links temporários e avatar.
- `src/charts.tsx`: gráficos em SVG, sem biblioteca.

## Base de alimentos

A busca local combina entradas selecionadas de alimentos e preparações brasileiras com consultas a fontes externas. A cobertura não é exaustiva: marcas, receitas regionais e nomes podem variar; valores de estimativa não são dados oficiais e podem diferir do alimento real. Os registros TBCA/USP que não tinham autorização comercial clara foram removidos do catálogo executável e substituídos por estimativas genéricas, identificadas na interface.

**Aviso de licença comercial:** a lista local contém registros derivados da TACO/NEPA-UNICAMP, mas a autorização explícita para redistribuição comercial desses dados não foi confirmada. A disponibilização pública da tabela não equivale, por si só, a uma licença comercial. Antes de comercializar ou redistribuir o catálogo, obtenha autorização escrita do titular ou substitua esses registros em lotes por dados com licença inequívoca, validando cada lote para evitar perda de cobertura. Não remova dados automaticamente: a proteção contra regressão exige validação antes de qualquer substituição.

- **USDA FoodData Central:** preferir registros cuja origem e licença pública estejam explícitas: https://fdc.nal.usda.gov/.
- **Open Food Facts:** base ODbL; atribuição e obrigações de compartilhamento podem se aplicar à base derivada. Imagens de produtos têm condições próprias: https://world.openfoodfacts.org/terms-of-use.
- **Auditoria de fontes e cobertura:** `docs/auditoria-cobertura-alimentar-brasileira-2026-10.md`.

A lista local existente está em `src/foods-taco.ts` e usa valores por 100 g; medidas caseiras e prioridade dos resultados ficam em `src/foods-br.ts`. Produtos embalados são consultados no Open Food Facts. A cobertura e as licenças devem ser revistas antes de ampliar o catálogo.

## Segurança e privacidade
- Política de Privacidade (LGPD) pública em `#/privacidade`; aceite obrigatório no cadastro.
- Recuperação de senha por e-mail (`resetPasswordForEmail` + tela de nova senha).
- Cabeçalhos de segurança e CSP em `public/_headers`.
- Pendente no painel do Supabase (não dá para fazer por código): Site URL/Redirect URL `https://leve.sistcs.com`, SMTP próprio e Leaked Password Protection.

## Custo zero
Cloudflare Workers (assets estáticos), Supabase Free, Open Food Facts, GitHub Actions e Google Fonts têm plano gratuito.
O workflow `keepalive` evita a pausa do projeto Supabase por inatividade. Limites do Supabase Free: 500 MB de banco, 1 GB de arquivos (fotos), 50 mil usuários ativos/mês.
