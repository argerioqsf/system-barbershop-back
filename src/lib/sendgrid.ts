import sgMail from '@sendgrid/mail'
import { env } from '@/env'
import { templateEmail } from '@/templates/templateEmail'
import { Leads } from '@prisma/client'

sgMail.setApiKey(env.TOKEN_EMAIL_TWILIO)

export const sendLeadEmail = async (to: string, name: string) => {
  const msg = {
    to,
    from: 'sim@grupomadretereza.com.br',
    subject: 'Você recebeu uma bolsa de desconto',
    text: `Olá ${name},\n\nObrigado por se cadastrar em nossa plataforma! Estamos muito felizes em tê-lo conosco. Nossa equipe entrará em contato com você em breve para fornecer mais informações e tirar todas as suas dúvidas.\n\nAtenciosamente,\nEquipe Sim`,
    html: templateEmail(
      name,
      'VOCÊ GANHOU!!!',
      'UMA BOLSA DE DESCONTO NO GRUPO MADRE TEREZA',
      'Obrigado por se cadastrar em nossa plataforma! Estamos muito felizes em tê-lo conosco. Nossa equipe entrará em contato com você em breve para fornecer mais informações e tirar todas as suas dúvidas.',
    ),
  }

  try {
    await sgMail.send(msg)
  } catch (error) {
    console.log(error)
  }
}

export const sendCreateIndicatorEmail = async (to: string, name: string) => {
  const msg = {
    to,
    from: 'sim@grupomadretereza.com.br',
    subject: 'Bem-vindo a plataforma SIM',
    text: `Olá ${name},\n\nObrigado por se cadastrar em nossa plataforma! Estamos muito felizes em tê-lo conosco. Nossa equipe entrará em contato com você em breve para fornecer mais informações e tirar todas as suas dúvidas.\n\nAtenciosamente,\nEquipe Sim`,
    html: templateEmail(
      name,
      'Bem-vindo ao Sistema de Indicação da Madre Tereza (SIM)',
      'Obrigado por se cadastrar como um indicador',
      'Sua conta está em analise, você recebera um email assim que for validada',
    ),
  }
  try {
    await sgMail.send(msg)
  } catch (error) {
    console.log(error)
  }
}

export const sendActiveIndicatorEmail = async (to: string, name: string) => {
  const msg = {
    to,
    from: 'sim@grupomadretereza.com.br',
    subject: 'Cadastro na plataforma',
    text: `Olá ${name},\n\nObrigado por se cadastrar em nossa plataforma! Estamos muito felizes em tê-lo conosco. Nossa equipe entrará em contato com você em breve para fornecer mais informações e tirar todas as suas dúvidas.\n\nAtenciosamente,\nEquipe Sim`,
    html: templateEmail(
      name,
      'Parabéns por fazer parte do Sistema de Indicação da Madre Tereza (SIM)',
      'Sua conta foi aprovada!!!',
      'Acesse o sistema e comece a indicar',
    ),
  }
  try {
    await sgMail.send(msg)
  } catch (error) {
    console.log(error)
  }
}

export const sendConfirmIndicatorPaymentEmail = async (
  to: string,
  name: string,
  lead: Leads,
) => {
  const msg = {
    to,
    from: 'sim@grupomadretereza.com.br',
    subject: 'Cadastro na plataforma',
    text: `Olá ${name},\n\nObrigado por se cadastrar em nossa plataforma! Estamos muito felizes em tê-lo conosco. Nossa equipe entrará em contato com você em breve para fornecer mais informações e tirar todas as suas dúvidas.\n\nAtenciosamente,\nEquipe Sim`,
    html: templateEmail(
      name,
      'Parabéns pelo lead confirmado',
      `O lead ${lead.name} confirmou sua matricula!!!`,
      `Foi contabilizado o valor de R$${lead.amount_pay_indicator} como saldo em sua conta \n \n assim que o pagamento for realizado voce sera informado`,
    ),
  }
  try {
    await sgMail.send(msg)
  } catch (error) {
    console.log(error)
  }
}
