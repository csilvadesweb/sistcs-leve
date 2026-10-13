export const PRIVACY_HASH = '#/privacidade';
export const isPrivacyRoute = () => typeof window !== 'undefined' && window.location.hash === PRIVACY_HASH;

/** Política de Privacidade (LGPD). Pública: abre mesmo sem login. */
export function PrivacyPolicy() {
  return (
    <div className="auth-screen">
      <article className="auth-card privacy-doc">
        <h1 className="auth-title">Política de Privacidade</h1>
        <p className="auth-note">SISTCS Leve · atualizada em 12/10/2026 · Lei nº 13.709/2018 (LGPD)</p>

        <h2>1. Quais dados coletamos</h2>
        <p>
          E-mail e senha (a senha é guardada de forma protegida pelo provedor de autenticação, nunca em texto aberto) e o que
          você mesmo registra: perfil e metas, peso, refeições, água, jejum, medicamentos/suplementos, exercícios, fotos de
          progresso e atividades sincronizadas do Health Connect, se você ativar. Dados de saúde são dados pessoais sensíveis.
        </p>

        <h2>2. Para que usamos</h2>
        <p>
          Apenas para operar o aplicativo: guardar seus registros, calcular calorias, metas e relatórios e sincronizar entre
          seus dispositivos. Não vendemos nem compartilhamos seus dados com terceiros para publicidade.
        </p>

        <h2>3. Base legal</h2>
        <p>Seu consentimento (art. 7º, I e art. 11, II, “a”, da LGPD), dado ao criar a conta. Você pode revogá-lo a qualquer momento.</p>

        <h2>4. Onde ficam os dados</h2>
        <p>
          Em banco de dados Supabase (região São Paulo), com acesso restrito por conta: cada usuário só enxerga os próprios
          registros. Fotos ficam em armazenamento privado. O aplicativo é entregue pela Cloudflare.
        </p>

        <h2>5. Serviços externos</h2>
        <p>
          Ao buscar alimentos por nome ou código de barras fora da tabela local, o texto buscado pode ser enviado ao Open Food
          Facts. Nenhum dado de identificação seu é enviado nessa busca.
        </p>

        <h2>6. Seus direitos</h2>
        <p>
          Em Perfil → “Privacidade e seus dados” você pode <strong>exportar</strong> tudo em JSON e{' '}
          <strong>apagar</strong> todos os seus registros. Em “Excluir minha conta” você apaga a conta, os registros e as fotos de forma definitiva. Para correção ou qualquer outro
          pedido previsto na LGPD, escreva para o contato abaixo.
        </p>

        <h2>7. Retenção e segurança</h2>
        <p>Mantemos os dados enquanto a conta existir. Usamos conexão criptografada (HTTPS), controle de acesso por linha no banco e armazenamento privado de fotos.</p>

        <h2>8. Aviso de saúde</h2>
        <p>O SISTCS Leve é uma ferramenta de acompanhamento e não substitui orientação de médico ou nutricionista. Estimativas de calorias são aproximadas.</p>

        <h2>9. Contato</h2>
        <p>Controlador: SISTCS. Contato do titular: <a href="mailto:privacidade@sistcs.com">privacidade@sistcs.com</a>.</p>

        <p className="auth-switch"><a className="link-button" href="#/">Voltar ao aplicativo</a></p>
      </article>
    </div>
  );
}
