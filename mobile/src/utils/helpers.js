// Utilitários para formatação e cálculos de gatos

// Calcula idade amigável a partir da data de nascimento (YYYY-MM-DD)
export function calcularIdade(dataNascStr) {
  if (!dataNascStr) return 'Idade não informada';

  const partes = dataNascStr.split('-');
  if (partes.length !== 3) return dataNascStr;

  const ano = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10) - 1;
  const dia = parseInt(partes[2], 10);

  const dataNasc = new Date(ano, mes, dia);
  const hoje = new Date();

  if (isNaN(dataNasc.getTime())) return dataNascStr;

  let anos = hoje.getFullYear() - dataNasc.getFullYear();
  let meses = hoje.getMonth() - dataNasc.getMonth();
  let dias = hoje.getDate() - dataNasc.getDate();

  if (dias < 0) {
    meses--;
  }
  if (meses < 0) {
    anos--;
    meses += 12;
  }

  if (anos < 0) return 'Data futura';

  if (anos === 0) {
    if (meses === 0) return 'Menos de 1 mês';
    return `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
  }

  if (meses === 0) {
    return `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
  }

  return `${anos} ${anos === 1 ? 'ano' : 'anos'} e ${meses} ${meses === 1 ? 'mês' : 'meses'}`;
}

// Formata data YYYY-MM-DD para DD/MM/YYYY
export function formatarDataBr(dataStr) {
  if (!dataStr) return '-';
  const partes = dataStr.split('-');
  if (partes.length !== 3) return dataStr;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}
