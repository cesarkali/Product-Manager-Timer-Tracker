// Fonte única dos Termos de Uso e Política de Privacidade do PMTT. Renderizada
// na página /privacidade, no leitor embutido do wizard de boas-vindas e no
// diálogo da tela de login — editar aqui atualiza os três lugares.

export const TERMS_UPDATED_AT = "11 de julho de 2026";

const SECTIONS: { title: string; paragraphs: React.ReactNode[] }[] = [
  {
    title: "1. O que é o PMTT",
    paragraphs: [
      <>
        O <strong>PMTT (Product Manager Time Tracker)</strong> é uma plataforma de registro de
        tempo de trabalho: cronômetro por categoria, lançamentos manuais, vínculo de tasks e
        relatórios. Está disponível como aplicativo web em{" "}
        <strong>pmtt.caliberda.com.br</strong> e como extensão para o navegador Chrome. Estes
        termos valem para os dois.
      </>,
    ],
  },
  {
    title: "2. Aceitação",
    paragraphs: [
      <>
        Ao criar uma conta e marcar o aceite no primeiro acesso, você concorda com estes Termos de
        Uso e com esta Política de Privacidade. O aceite fica registrado na sua conta com data e
        hora. Se não concordar com algo aqui, não use a plataforma.
      </>,
    ],
  },
  {
    title: "3. Sua conta",
    paragraphs: [
      <>
        A conta é criada com e-mail e senha ou com o login do Google, e é{" "}
        <strong>pessoal e intransferível</strong>. Você é responsável por manter a senha segura e
        por tudo que acontece na sua conta. Podemos suspender contas usadas de forma abusiva
        (tentativas de acesso a dados de terceiros, sobrecarga intencional do serviço ou uso
        ilegal).
      </>,
    ],
  },
  {
    title: "4. Quais dados coletamos",
    paragraphs: [
      <>
        <strong>Dados de conta:</strong> e-mail, nome de exibição e o registro do aceite destes
        termos.
      </>,
      <>
        <strong>Dados que você cria:</strong> categorias, áreas, registros de tempo (horários,
        durações, descrições, comentários), links de tasks e preferências de uso. São os seus
        dados de trabalho — você os cria, edita e exclui livremente.
      </>,
      <>
        <strong>O que NÃO coletamos:</strong> histórico de navegação, conteúdo das páginas que
        você visita, análise de comportamento, cookies de publicidade ou qualquer dado vendável.
        Não há rastreadores de terceiros na plataforma.
      </>,
    ],
  },
  {
    title: "5. Extensão do Chrome",
    paragraphs: [
      <>
        A extensão usa a permissão de abas exclusivamente para dois recursos que você controla:
        capturar a URL da aba ativa quando <strong>você clica</strong> no botão de vincular, e
        comparar o endereço da aba com as <strong>regras por domínio que você mesmo cadastra</strong>{" "}
        para sugerir categoria. Nenhuma URL é armazenada ou enviada para fora do seu dispositivo —
        a comparação acontece localmente.
      </>,
      <>
        As notificações de sugestão nunca trocam a categoria sozinhas: a decisão é sempre sua, e
        elas podem ser silenciadas ou desativadas nas opções da extensão.
      </>,
    ],
  },
  {
    title: "6. Onde os dados ficam e como são protegidos",
    paragraphs: [
      <>
        Os dados são armazenados no <strong>Firebase (Google Cloud Platform)</strong>, com acesso
        protegido por autenticação e por regras de segurança que garantem que{" "}
        <strong>cada conta só enxerga os próprios dados</strong>. O tráfego é criptografado (HTTPS)
        de ponta a ponta. Não temos acesso à sua senha — a autenticação é gerenciada pelo Firebase
        Authentication.
      </>,
    ],
  },
  {
    title: "7. Seus direitos (LGPD)",
    paragraphs: [
      <>
        Nos termos da Lei Geral de Proteção de Dados (Lei 13.709/2018), você pode a qualquer
        momento: <strong>acessar</strong> seus dados (eles estão todos visíveis na plataforma),{" "}
        <strong>corrigi-los</strong> (tudo é editável), <strong>exportá-los</strong> (relatórios em
        PDF pelo dashboard) e <strong>excluí-los</strong> — registros e categorias podem ser
        apagados na própria interface; para excluir a conta inteira, use o contato abaixo.
      </>,
    ],
  },
  {
    title: "8. Exclusão de conta",
    paragraphs: [
      <>
        Solicitada a exclusão, a conta e todos os dados associados (registros, categorias, áreas e
        preferências) são removidos permanentemente dos servidores. A exclusão é irreversível —
        exporte seus relatórios antes, se quiser guardá-los.
      </>,
    ],
  },
  {
    title: "9. Disponibilidade e responsabilidade",
    paragraphs: [
      <>
        O PMTT é fornecido “como está”, sem garantia de disponibilidade ininterrupta. Fazemos o
        razoável para manter o serviço no ar e os dados íntegros, mas recomendamos exportar
        relatórios importantes. Não nos responsabilizamos por decisões tomadas com base nos
        relatórios nem por indisponibilidades de serviços de terceiros (Google/Firebase).
      </>,
    ],
  },
  {
    title: "10. Alterações destes termos",
    paragraphs: [
      <>
        Estes termos podem ser atualizados para refletir novos recursos ou exigências legais.
        Mudanças relevantes serão comunicadas pelo aviso de <strong>Novidades</strong> dentro da
        plataforma, com a data de atualização revisada no topo desta página. O uso continuado
        após a mudança vale como concordância.
      </>,
    ],
  },
  {
    title: "11. Contato",
    paragraphs: [
      <>
        Dúvidas, solicitações de dados ou pedido de exclusão de conta:{" "}
        <a
          href="mailto:julio@caliberda.com.br"
          className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
        >
          julio@caliberda.com.br
        </a>
        .
      </>,
    ],
  },
];

export function TermsContent() {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Última atualização: {TERMS_UPDATED_AT}
      </p>
      {SECTIONS.map((section) => (
        <section key={section.title}>
          <h2 className="mb-2 text-base font-semibold">{section.title}</h2>
          <div className="flex flex-col gap-2.5">
            {section.paragraphs.map((paragraph, i) => (
              <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
