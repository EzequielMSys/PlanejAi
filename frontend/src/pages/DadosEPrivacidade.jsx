import { Link } from 'react-router-dom'

export default function DadosEPrivacidade() {
  return <main id="conteudo-principal" className="pj-page">
    <div className="pj-wrap" style={{ maxWidth: '52rem', margin: '0 auto', padding: '2rem 1rem' }}>
      <Link to="/">← PlanejAI</Link>
      <h1>Seus dados no PlanejAI</h1>
      <p>Esta página explica como os recursos do produto usam informações da sua conta. O serviço de IA pode ser operado por um provedor externo configurado pelo responsável pela plataforma.</p>
      <h2>Dados usados no estudo</h2>
      <p>Nome, email, perfil de estudos, planejamento, respostas, redações, anotações e conversas podem ser guardados para você retomar o trabalho. Fotos de perfil e banners são exibidos por endereço público para que apareçam na plataforma; evite usar uma imagem que não queira tornar visível.</p>
      <h2>O que pode chegar à IA</h2>
      <p>Ao pedir uma resposta à Lumi, a mensagem e o contexto da conversa são enviados ao provedor de IA configurado. Conforme o modo escolhido, esse contexto pode incluir seu nome, disciplina, perfil de estudos, progresso, lições, tentativas, revisões e trechos de redação. Quando você escolhe registros específicos, a conversa usa os trechos que você conferiu. Uma foto ou arquivo só é enviado para leitura depois da sua ação de pedir essa leitura.</p>
      <p>Não envie senhas, documentos de identidade, dados financeiros ou informações de terceiros que não sejam necessárias à dúvida. O provedor e o prazo de retenção dele dependem da configuração contratada pelo responsável; peça esses detalhes na central de ajuda antes de compartilhar conteúdo sensível.</p>
      <h2>Acesso e exclusão</h2>
      <p>Na área “Ajuda e seus dados”, você pode baixar um arquivo com registros associados à sua conta e solicitar exclusão. O pedido é analisado pela equipe; a conta permanece ativa até que a conclusão seja confirmada no atendimento. A exportação é um arquivo JSON e pode conter textos e capturas enviados ao suporte: guarde o arquivo em local privado. Alguns arquivos são representados por seus endereços, sem o conteúdo binário.</p>
      <p>Uma exclusão deve incluir registros do banco, arquivos associados e o tratamento das cópias de segurança. O andamento e a conclusão precisam ser informados no pedido de atendimento.</p>
      <p><Link to="/login">Entrar para acessar “Ajuda e seus dados”</Link></p>
    </div>
  </main>
}
