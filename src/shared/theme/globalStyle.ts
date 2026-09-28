import type { ThemeTokens } from './types';

export function getGlobalStyle(T: ThemeTokens): string {
  return `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
html,body{height:100%;overflow:hidden;}
body{font-family:'DM Sans',sans-serif;background:${T.bg};color:${T.text};transition:background 0.3s ease,color 0.3s ease;}
#root{height:100%;}
::-webkit-scrollbar{width:6px;height:6px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px;}
::-webkit-scrollbar-thumb:hover{background:${T.textMuted};border-radius:3px;}
input,textarea,select,button{font-family:'DM Sans',sans-serif;}
@keyframes slideIn{from{transform:translateX(600px);}to{transform:translateX(0);}}
@keyframes fadeIn{from{opacity:0;transform:scale(0.95);}to{opacity:1;transform:scale(1);}}
`;
}



