import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade | PMTT Timer",
  description: "Política de Privacidade da extensão PMTT Timer.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 shadow-sm rounded-lg p-8 sm:p-10 border border-zinc-200 dark:border-zinc-800">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">
          Política de Privacidade - PMTT Timer
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-sm">
          Última atualização: 10 de julho de 2026
        </p>

        <div className="space-y-6 text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              1. Visão Geral
            </h2>
            <p>
              O PMTT Timer é uma ferramenta de uso interno projetada para
              facilitar o apontamento de horas e o fluxo de trabalho da equipe.
              Esta Política de Privacidade descreve como os seus dados são
              coletados, usados e protegidos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              2. Dados Coletados
            </h2>
            <p className="mb-2">A extensão coleta estritamente o necessário para o seu funcionamento:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Informações de Autenticação:</strong> Seu endereço de
                e-mail utilizado para fazer login no sistema e o token de
                autenticação gerado pelo Firebase.
              </li>
              <li>
                <strong>Conteúdo do Site (Host):</strong> Ao navegar no Movidesk
                ou Jira, a extensão lê o ID do ticket/issue na tela para sugerir
                vínculos automáticos com o seu cronômetro.
              </li>
              <li>
                <strong>Registros de Tempo:</strong> As tarefas iniciadas, pausadas,
                descrições, comentários e a duração de cada apontamento.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              3. Uso dos Dados
            </h2>
            <p>
              Todos os dados coletados têm um único propósito: garantir o
              funcionamento da aplicação (salvar seus registros de horas e
              sincronizá-los com sua conta). Nossos sistemas não realizam
              rastreamento oculto (tracking) de outras abas ou navegação web que
              não sejam os domínios corporativos explícitos (Movidesk/Jira).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              4. Compartilhamento e Venda de Dados
            </h2>
            <p>
              Declaramos expressamente que <strong>NÃO</strong> vendemos,
              alugamos ou transferimos qualquer dado coletado dos usuários para
              terceiros. Os dados são mantidos em banco de dados privado
              (Firebase/Firestore) exclusivo para as métricas internas da empresa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              5. Segurança
            </h2>
            <p>
              Implementamos regras rigorosas de segurança em nosso banco de dados
              para garantir que um usuário autenticado só possa acessar e
              modificar os seus próprios registros de horas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              6. Contato
            </h2>
            <p>
              Caso tenha dúvidas sobre como seus dados estão sendo tratados,
              entre em contato com os administradores do sistema internamente.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
