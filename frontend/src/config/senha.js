// A regra de senha precisa ser idêntica no frontend e no backend: se a tela
// pedir 12 e o servidor aceitar 8 (ou o contrário), o usuário recebe uma
// mensagem e um erro inexplicável. O valor vem do backend e é replicado aqui
// em uma única constante.
export const SENHA_MINIMA = 8

export const REQUISITOS_SENHA = `Mín. ${SENHA_MINIMA} caracteres, com maiúscula, minúscula e número`

// Espelha validarSenhaForte do servidor. Precisa ser idêntica, então qualquer
// mudança tem de ser feita nos dois lados — os testes verificam que os dois
// arquivos concordam sobre o número.
export function validarSenha(senha) {
  if (!senha) return 'Senha é obrigatória'
  const falhas = []
  if (senha.length < SENHA_MINIMA) falhas.push(`mínimo ${SENHA_MINIMA} caracteres`)
  if (!/[A-Z]/.test(senha)) falhas.push('1 maiúscula')
  if (!/[a-z]/.test(senha)) falhas.push('1 minúscula')
  if (!/\d/.test(senha)) falhas.push('1 número')
  return falhas.length ? `Precisa ${falhas.join(', ')}` : null
}
