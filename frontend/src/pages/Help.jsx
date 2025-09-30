import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Book, Key, Shield, Clock, Share2, Users, Bell, Upload, FileKey, Search, ChevronDown, ChevronRight } from 'lucide-react';

const Help = () => {
  const [expandedSection, setExpandedSection] = useState('getting-started');

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const sections = [
    {
      id: 'getting-started',
      title: '🚀 Primeiros Passos',
      icon: Book,
      content: [
        {
          subtitle: 'Bem-vindo ao V4 KeyKeeper',
          text: 'O V4 KeyKeeper é um gerenciador de senhas corporativo seguro e compliant com LGPD, desenvolvido especificamente para equipes de marketing e growth da V4 Company.'
        },
        {
          subtitle: 'Fazendo Login',
          text: 'Utilize sua conta Google Workspace da @v4company.com para fazer login. O sistema usa autenticação OAuth do Google para máxima segurança.'
        },
        {
          subtitle: 'Níveis de Acesso',
          text: `
• Admin: Acesso total, gerenciamento de usuários e configurações
• Manager: Gerenciar vaults, aprovar acessos temporários
• Contributor: Criar e acessar itens em vaults autorizados
• Client: Acesso restrito para submissão de credenciais
          `
        }
      ]
    },
    {
      id: 'vaults',
      title: '📁 Vaults (Cofres)',
      icon: FileKey,
      content: [
        {
          subtitle: 'O que são Vaults?',
          text: 'Vaults são pastas organizacionais hierárquicas que armazenam suas credenciais. Você pode criar estruturas como: Cliente > Produto > Squad.'
        },
        {
          subtitle: 'Tipos de Vaults',
          text: `
• Client: Para organizar por cliente
• Product: Para produtos ou projetos específicos
• Squad: Para equipes internas
          `
        },
        {
          subtitle: 'Como Criar um Vault',
          text: '1. Clique em "New Vault" no explorador\n2. Escolha o tipo e nome\n3. Opcionalmente, selecione um vault pai para criar hierarquia\n4. Configure tags para melhor organização'
        },
        {
          subtitle: 'Permissões (ACL)',
          text: 'Cada vault possui sua própria lista de controle de acesso. Apenas usuários autorizados podem visualizar ou editar itens dentro do vault.'
        }
      ]
    },
    {
      id: 'credentials',
      title: '🔑 Gerenciamento de Credenciais',
      icon: Key,
      content: [
        {
          subtitle: 'Tipos de Credenciais Suportadas',
          text: `
• Web Credentials: Login e senha para sites
• API Keys: Chaves de API e tokens
• Google Ads: IDs de conta, MCC, GTM, pixels
• Meta Ads: Business Manager, Ad Account, Pixel
• TikTok Ads: Advertiser ID, Pixel
• LinkedIn Ads: Account ID, Campaign Manager
• Social Logins: Credenciais de redes sociais
• SSH Keys: Chaves SSH para servidores
• Database Credentials: Acesso a bancos de dados
• Certificates: Certificados SSL/TLS
• Secure Notes: Notas seguras criptografadas
          `
        },
        {
          subtitle: 'Criando uma Credencial',
          text: '1. Selecione um vault\n2. Clique em "New Item"\n3. Escolha o tipo de credencial\n4. Preencha os campos dinâmicos\n5. Configure criticidade e ambiente\n6. Adicione notas e instruções se necessário'
        },
        {
          subtitle: 'Campos Especiais',
          text: `
• Environment: prod, staging, dev
• Criticality: high, medium, low
• Expires At: Data de expiração (notificação automática)
• No-Copy: Impede cópia da senha
• Requires Checkout: Exige check-out para visualizar
          `
        }
      ]
    },
    {
      id: 'security',
      title: '🛡️ Segurança e Criptografia',
      icon: Shield,
      content: [
        {
          subtitle: 'Criptografia AES-256',
          text: 'Todas as senhas são criptografadas usando AES-256, o mesmo padrão usado por bancos e governos. As senhas são criptografadas no servidor antes de serem armazenadas.'
        },
        {
          subtitle: 'Zero-Knowledge Security',
          text: 'Suas credenciais são criptografadas do lado do cliente sempre que possível, garantindo que mesmo administradores do sistema não possam acessar suas senhas sem autorização.'
        },
        {
          subtitle: 'Auditoria Completa',
          text: 'Todas as ações são registradas: quem acessou qual credencial, quando, de onde (IP) e qual dispositivo. Os logs são imutáveis e podem ser auditados.'
        },
        {
          subtitle: 'Conformidade LGPD',
          text: 'Sistema 100% em conformidade com a Lei Geral de Proteção de Dados brasileira, com dados residindo no Brasil e trilha de auditoria completa.'
        }
      ]
    },
    {
      id: 'jit-access',
      title: '⏰ Acesso Temporário (JIT)',
      icon: Clock,
      content: [
        {
          subtitle: 'O que é JIT Access?',
          text: 'Just-in-Time Access permite solicitar acesso temporário a uma credencial específica por um período limitado (ex: 2 horas). Após expirar, o acesso é revogado automaticamente.'
        },
        {
          subtitle: 'Como Solicitar',
          text: '1. Abra o item desejado\n2. Clique em "Request Temporary Access"\n3. Informe o motivo e duração necessária\n4. Aguarde aprovação de admin/manager'
        },
        {
          subtitle: 'Aprovação',
          text: 'Managers e Admins recebem notificações de novas solicitações e podem aprovar ou negar. O acesso aprovado expira automaticamente.'
        },
        {
          subtitle: 'Notificações',
          text: 'Você será notificado quando seu acesso for aprovado ou negado, e receberá um alerta quando estiver próximo de expirar.'
        }
      ]
    },
    {
      id: 'breakglass',
      title: '🚨 Break-glass (Acesso de Emergência)',
      icon: Shield,
      content: [
        {
          subtitle: 'Quando Usar',
          text: 'Break-glass é para situações de EMERGÊNCIA REAL, como servidores caindo em produção. Use com responsabilidade, pois notifica todos os admins imediatamente.'
        },
        {
          subtitle: 'Como Funciona',
          text: '1. Clique em "Emergency Access" no item\n2. Descreva detalhadamente a emergência\n3. Acesso é concedido imediatamente\n4. Webhook do Google Chat notifica todos os admins\n5. Auditoria especial é criada'
        },
        {
          subtitle: 'Responsabilidade',
          text: 'Uso indevido de break-glass é rastreado e pode resultar em ações disciplinares. Use apenas em emergências reais.'
        }
      ]
    },
    {
      id: 'one-time-link',
      title: '🔗 Link de Visualização Única',
      icon: Share2,
      content: [
        {
          subtitle: 'Compartilhamento Seguro',
          text: 'Crie links autodestrutivos para compartilhar credenciais com segurança. O link pode ser visualizado apenas UMA vez e depois é permanentemente deletado.'
        },
        {
          subtitle: 'Como Criar',
          text: '1. Abra o item que deseja compartilhar\n2. Clique em "Generate One-Time Link"\n3. Copie o link gerado\n4. Envie via canal seguro (email, Slack, etc.)'
        },
        {
          subtitle: 'Características de Segurança',
          text: `
• Visualização única garantida
• Expira em 24 horas automaticamente
• Timer de 60 segundos na visualização
• Rastreamento de IP do visualizador
• Deleção permanente após visualização
• Auditoria completa do acesso
          `
        }
      ]
    },
    {
      id: 'checkout',
      title: '🔐 Check-out de Credenciais',
      icon: Key,
      content: [
        {
          subtitle: 'O que é Check-out?',
          text: 'Algumas credenciais críticas exigem check-out, como pegar um livro emprestado. Apenas uma pessoa pode ter acesso por vez.'
        },
        {
          subtitle: 'Como Usar',
          text: '1. Clique em "Check-out" no item\n2. Use a credencial\n3. Quando terminar, clique em "Check-in"\n4. Próxima pessoa pode fazer check-out'
        },
        {
          subtitle: 'Benefícios',
          text: 'Evita conflitos de uso simultâneo, rastreia quem está usando a credencial no momento, e garante accountability.'
        }
      ]
    },
    {
      id: 'client-submit',
      title: '📤 Link de Submissão para Clientes',
      icon: Users,
      content: [
        {
          subtitle: 'Compartilhamento Seguro com Clientes',
          text: 'Permite que clientes enviem credenciais sem precisar de acesso ao sistema. Ideal para receber logins de clientes de forma segura.'
        },
        {
          subtitle: 'Como Gerar',
          text: '1. Selecione um vault do tipo "client"\n2. Clique no ícone de compartilhamento\n3. Clique em "Generate Client Link"\n4. Envie o link para o cliente'
        },
        {
          subtitle: 'O que o Cliente Vê',
          text: 'Uma página simples e segura onde pode submeter credenciais. Ele não vê outras credenciais do vault, apenas pode adicionar novas.'
        }
      ]
    },
    {
      id: 'notifications',
      title: '🔔 Notificações',
      icon: Bell,
      content: [
        {
          subtitle: 'Central de Notificações',
          text: 'Clique no sino no topo da página para ver suas notificações. Atualiza automaticamente a cada 30 segundos.'
        },
        {
          subtitle: 'Tipos de Notificações',
          text: `
• Solicitações JIT pendentes (admin/manager)
• Credenciais expirando em 7 dias
• Solicitações de break-glass (admin)
• Aprovações ou negações de acesso
          `
        },
        {
          subtitle: 'Webhooks',
          text: 'Admins podem configurar um webhook do Google Chat em Settings para receber alertas críticos em tempo real.'
        }
      ]
    },
    {
      id: 'import',
      title: '📥 Importação em Massa',
      icon: Upload,
      content: [
        {
          subtitle: 'Importar de CSV/Excel',
          text: 'Importe múltiplas credenciais de uma vez usando planilhas CSV ou Excel.'
        },
        {
          subtitle: 'Como Importar',
          text: '1. Vá em Import no menu\n2. Baixe o template CSV\n3. Preencha com suas credenciais\n4. Upload do arquivo\n5. Revise os resultados'
        },
        {
          subtitle: 'Formato do Template',
          text: 'O template inclui colunas para vault_path, type, title, login, password, login_url, environment, criticality, client e squad.'
        }
      ]
    },
    {
      id: 'search',
      title: '🔍 Busca e Filtros',
      icon: Search,
      content: [
        {
          subtitle: 'Busca Rápida',
          text: 'Use a barra de busca no topo do vault explorer para encontrar credenciais rapidamente por título, login ou URL.'
        },
        {
          subtitle: 'Filtros Disponíveis',
          text: `
• Por tipo de credencial
• Por ambiente (prod, staging, dev)
• Por criticidade (high, medium, low)
• Combine múltiplos filtros
          `
        }
      ]
    },
    {
      id: 'audit',
      title: '📋 Logs de Auditoria',
      icon: FileKey,
      content: [
        {
          subtitle: 'Rastreabilidade Total',
          text: 'Todos os acessos e ações são registrados com timestamp, usuário, IP e detalhes da ação.'
        },
        {
          subtitle: 'Visualizando Logs',
          text: 'Vá em "Audit Logs" no menu para ver o histórico completo. Admins e managers têm acesso total.'
        },
        {
          subtitle: 'Tipos de Eventos',
          text: 'Login, logout, criação/edição/deleção de itens, acessos JIT, break-glass, visualização de senhas, check-out/in, e muito mais.'
        }
      ]
    }
  ];

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <Sidebar />
      
      <div className="flex-1">
        <Header title="Central de Ajuda" description="Documentação completa do V4 KeyKeeper" />
        
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header Card */}
            <div className="bg-gradient-to-r from-[#ff2c2c] to-[#e61919] rounded-xl p-8 text-white mb-8 shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                  <Book className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">V4 KeyKeeper Wiki</h1>
                  <p className="text-white/90">Guia completo de todas as funcionalidades</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-2xl font-bold mb-1">🔒</p>
                  <p className="text-sm">LGPD Compliant</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-2xl font-bold mb-1">🔐</p>
                  <p className="text-sm">AES-256 Encryption</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-2xl font-bold mb-1">📝</p>
                  <p className="text-sm">Full Audit Trail</p>
                </div>
              </div>
            </div>

            {/* Documentation Sections */}
            <div className="space-y-4">
              {sections.map((section) => (
                <div key={section.id} className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden shadow-sm">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between p-6 hover:bg-[#fafafa] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <section.icon className="w-6 h-6 text-[#ff2c2c]" />
                      <h2 className="text-xl font-bold text-[#1f2937]">{section.title}</h2>
                    </div>
                    {expandedSection === section.id ? (
                      <ChevronDown className="w-5 h-5 text-[#6b7280]" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-[#6b7280]" />
                    )}
                  </button>
                  
                  {expandedSection === section.id && (
                    <div className="px-6 pb-6 space-y-4 border-t border-[#e5e7eb] pt-4">
                      {section.content.map((item, index) => (
                        <div key={index}>
                          <h3 className="font-semibold text-[#1f2937] mb-2">{item.subtitle}</h3>
                          <p className="text-[#6b7280] whitespace-pre-line leading-relaxed">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 mb-2">💡 Precisa de mais ajuda?</h3>
              <p className="text-blue-800 text-sm">
                Entre em contato com o time de TI da V4 Company ou abra um ticket no sistema de suporte interno.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
