const formasDeConvite = {
  ela_dela: 'juntas',
  ele_dele: 'juntos',
  elu_delu: 'juntes',
}

export function fraseConviteLumi(pronome) {
  const forma = formasDeConvite[pronome]
  return forma ? `Vamos pensar ${forma}?` : 'Vamos pensar nisso?'
}
