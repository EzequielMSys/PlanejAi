import Logo from './Logo'
export default function BrandCover() {
  return <div className="brand-cover" aria-label="PlanejAI: entender, praticar e retomar">
    <div className="brand-cover-top"><span>O CONHECIMENTO CONTINUA.</span><span aria-hidden="true">↗</span></div>
    <div className="brand-cover-symbol" aria-hidden="true"><Logo className="brand-cover-mark" animado={false}/><span>uma ideia<br/><em>abre outra.</em></span></div>
    <ol className="brand-cover-steps"><li><b>01</b><span>Entender<small>Uma pergunta que faz sentido.</small></span></li><li><b>02</b><span>Praticar<small>Uma tentativa com suas palavras.</small></span></li><li><b>03</b><span>Retomar<small>Um novo olhar sobre o que aprendeu.</small></span></li></ol>
    <footer>SEU TEMPO. SEU JEITO. SEU PRÓXIMO PASSO.</footer>
  </div>
}
