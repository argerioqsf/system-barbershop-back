import sgMail from '@sendgrid/mail'
import { env } from '@/env'
import { templateEmail } from '@/templates/templateEmail'
import { logger } from './logger'

sgMail.setApiKey(env.TOKEN_EMAIL_TWILIO)

export const sendLeadEmail = async (to: string, name: string) => {
  const msg = {
    to,
    from: 'sim@grupomadretereza.com.br',
    subject:
      '🎁 Você ganhou!!! Uma excelente oportunidade que mudará o seu futuro!',
    text: `text`,
    html: templateEmail(
      name,
      `Temos uma ótima notícia para você!<br/><br/>

       Alguém que te conhece indicou você para fazer parte do <b>Grupo Madre Tereza</b>, o maior grupo
       educacional do Amapá. E, para tornar essa experiência ainda mais especial, você acaba de
       receber um presente exclusivo para facilitar seu ingresso! <br/><br/>

       Seja no maternal, nos cursos técnicos, na graduação ou até mesmo na pós-graduação, o Grupo
       Madre Tereza oferece a melhor estrutura e ensino de qualidade para todas as etapas da sua
       jornada educacional. Esta é a oportunidade perfeita para você se desenvolver e alcançar seus
       objetivos.  <br/><br/>
       
       Nosso time está à disposição para te ajudar a dar o próximo passo. Entre em contato matrícula:
       <a href='https://wa.me/message/HDPQFMYF6KEZN1'>Whatsapp</a> e descubra como esse presente pode te abrir as
       portas para um futuro brilhante!

       Esperamos por você! <br/><br/>`,
    ),
  }

  try {
    await sgMail.send(msg)
  } catch (error) {
    logger.error('Failed to send lead email', {
      error,
      to,
    })
  }
}

export const sendCreateIndicatorEmail = async (to: string, name: string) => {
  const msg = {
    to,
    from: 'sim@grupomadretereza.com.br',
    subject: 'Bem-vindo ao Sistema de Indicadores da Madre!',
    text: `text`,
    html: templateEmail(
      name,
      `Parabéns por sua decisão de fazer parte do Sistema de Indicadores da Madre (barbershop)!
       Estamos muito felizes em tê-lo como parte dessa jornada e por contar com sua colaboração para 
       fortalecer ainda mais o nosso time. <br/><br/>

       Seu cadastro está em análise, e em breve você receberá um e-mail com a confirmação e o link
       de acesso à sua conta. Estamos ansiosos para que você possa começar a aproveitar todas as
       vantagens que o SIM oferece.  <br/><br/>

       Mais uma vez, seja bem-vindo e conte conosco para o que precisar! <br/><br/>`,
    ),
  }
  try {
    await sgMail.send(msg)
  } catch (error) {
    logger.error('Failed to send create indicator email', {
      error,
      to,
    })
  }
}

export const sendActiveIndicatorEmail = async (to: string, name: string) => {
  const msg = {
    to,
    from: 'sim@grupomadretereza.com.br',
    subject: 'Sua conta foi aprovada! Hora de começar a indicar e ganhar!',
    text: `text`,
    html: templateEmail(
      name,
      `Boas notícias! Sua conta no <b>Sistema de Indicadores da Madre (SIM)</b> foi aprovada, e agora você já
       pode começar a indicar pessoas e ganhar bônus por cada matrícula confirmada.<br/><br/>
       
       É muito simples!<br/>
       Acesse seu dashboard pelo link abaixo, e tenah exclusivo e compartilhe com seus contatos: <a href='https://sim.grupomadretereza.com.br'>Acesse aqui</a><br/><br/>

       Cada indicação que resultar na contratação de serviços do Grupo Madre Tereza vai gerar um bônus
       para você. Quanto mais você indicar, mais você ganha! <br/><br/>

       Estamos ansiosos para ver você ajudar outras pessoas a transformarem suas vidas através da
       educação.<br/><br/>

       Vamos juntos nessa jornada! <br/><br/>`,
    ),
  }
  try {
    await sgMail.send(msg)
  } catch (error) {
    logger.error('Failed to send active indicator email', {
      error,
      to,
    })
  }
}

export const sendContractEmail = async function (
  to: string,
  name: string,
  link: string,
): Promise<boolean> {
  const msg = {
    to,
    from: 'sim@grupomadretereza.com.br',
    subject: 'Sua contrato para indicador!',
    text: `text`,
    html: templateEmail(
      name,
      `Seu contrato para se tornar um indicador<br/><br/>
       
       Acesse o link e assine digitalmente!<br/>
       <a href='${link}'>Acesse aqui seu contrato</a><br/><br/>`,
    ),
  }
  try {
    await sgMail.send(msg)
    return true
  } catch (error) {
    logger.error('Failed to send contract email', {
      error,
      to,
    })
    return false
  }
}

export const sendConfirmIndicatorPaymentEmail = async (
  to: string,
  name: string,
  lead: { name: string },
) => {
  const msg = {
    to,
    from: 'sim@grupomadretereza.com.br',
    subject: 'Parabéns! Você acaba de ganhar um bônus no SIM!',
    text: `text`,
    html: templateEmail(
      name,
      `Temos uma ótima notícia para você!<br/><br/>
      
       O Lead <b>${lead.name}</b>, que você indicou, acaba de efetuar a matrícula no Grupo Educacional
       Madre Tereza. Seu esforço foi recompensado, e o bônus já foi contabilizado em sua conta
       no <b>Sistema de Indicadores da Madre (SIM)</b>.<br/><br/>
       
       Para conferir o valor e acompanhar sua evolução no programa, acesse seu dashboard: <a href='https://sim.grupomadretereza.com.br'>Acesse aqui</a><br/><br/>

       Lembre-se: quanto mais pessoas você indicar, mais bonificações você acumula. Afinal, <b>ajudar
       alguém a alcançar seus objetivos educacionais é um presente tanto para eles quanto para você!</b> <br/><br/>

       Continue assim, e vamos juntos transformar vidas por meio da educação!<br/><br/>

       Vamos juntos nessa jornada! <br/><br/>`,
    ),
  }
  try {
    await sgMail.send(msg)
  } catch (error) {
    logger.error('Failed to send confirm indicator payment email', {
      error,
      to,
      lead,
    })
  }
}

export const sendPasswordResetEmail = async (
  to: string,
  name: string,
  link: string,
) => {
  const msg = {
    to,
    from: 'sim@grupomadretereza.com.br',
    subject: 'Recuperação de Senha',
    text: `Acesse o link para redefinir sua senha: ${link}`,
    html: templateEmail(
      name,
      `Você solicitou a redefinição de senha.<br/><br/><a href='${link}'>Clique aqui para criar uma nova senha</a>`,
    ),
  }
  try {
    await sgMail.send(msg)
  } catch (error) {
    logger.error('Failed to send password reset email', {
      error,
      to,
    })
  }
}
