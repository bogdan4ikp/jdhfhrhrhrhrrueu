import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Brain, Clock, ChevronDown, ChevronUp, Copy, Check, Paperclip, X, Settings, Image as ImageIcon, File, Camera, Scan, Play, Sun, Moon, Monitor, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SpatialNavigation from 'spatial-navigation-js';

const TRANSLATIONS = {
  ru: {
    title: "Здравствуйте!",
    subtitle: "Чем я могу вам помочь сегодня?",
    placeholder: "Спроси меня о чем-нибудь...",
    thinking: "Думаю...",
    thoughtToggle: "Размышления",
    settings: "Настройки",
    language: "Язык",
    theme: "Тема",
    light: "Светлая",
    dark: "Тёмная",
    system: "Системная",
    version: "Версия 1.0",
    error: "Ошибка сети",
    errorPrefix: "Ошибка:",
    copy: "Копировать",
    attach: "Прикрепить изображение",
    enableThoughts: "Показывать размышления",
    attachPhoto: "Фото и видео",
    attachFile: "Загрузить файл",
    attachCamera: "Сделать фото",
    attachScan: "Отсканировать документ",
    offlineTitle: "Отсутствует подключение к интернету",
    offlineDesc: "Для работы Solvexa требуется стабильное подключение. Пожалуйста, подключитесь к сети."
  },
  en: {
    title: "Hello!",
    subtitle: "How can I help you today?",
    placeholder: "Ask me anything...",
    thinking: "Thinking...",
    thoughtToggle: "Thoughts",
    settings: "Settings",
    language: "Language",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    system: "System",
    version: "Version 1.0",
    error: "Network error",
    errorPrefix: "Error:",
    copy: "Copy",
    attach: "Attach image",
    enableThoughts: "Show thoughts",
    attachPhoto: "Photo & Video",
    attachFile: "Upload file",
    attachCamera: "Take photo",
    attachScan: "Scan document",
    offlineTitle: "No Internet Connection",
    offlineDesc: "Solvexa requires an active internet connection. Please connect to the network to continue."
  },
  es: {
    title: "¡Hola!",
    subtitle: "¿Cómo puedo ayudarte hoy?",
    placeholder: "Pregúntame cualquier cosa...",
    thinking: "Pensando...",
    thoughtToggle: "Pensamientos",
    settings: "Configuración",
    language: "Idioma",
    theme: "Tema",
    light: "Claro",
    dark: "Oscuro",
    system: "Sistema",
    version: "Versión 1.0",
    error: "Error de red",
    errorPrefix: "Error:",
    copy: "Copiar",
    attach: "Adjuntar imagen",
    enableThoughts: "Mostrar pensamientos",
    attachPhoto: "Foto y video",
    attachFile: "Subir archivo",
    attachCamera: "Tomar foto",
    attachScan: "Escanear documento",
    offlineTitle: "Sin Conexión a Internet",
    offlineDesc: "Solvexa requiere una conexión a Internet activa. Conéctese a la red para continuar."
  },
  fr: {
    title: "Bonjour!",
    subtitle: "Comment puis-je vous aider aujourd'hui?",
    placeholder: "Demandez-moi n'importe quoi...",
    thinking: "En pensant...",
    thoughtToggle: "Pensées",
    settings: "Paramètres",
    language: "Langue",
    theme: "Thème",
    light: "Clair",
    dark: "Sombre",
    system: "Système",
    version: "Version 1.0",
    error: "Erreur réseau",
    errorPrefix: "Erreur:",
    copy: "Copier",
    attach: "Joindre une image",
    enableThoughts: "Afficher les pensées",
    attachPhoto: "Photo et vidéo",
    attachFile: "Téléverser un fichier",
    attachCamera: "Prendre une photo",
    attachScan: "Numériser un document",
    offlineTitle: "Pas de Connexion Internet",
    offlineDesc: "Solvexa requiert une connexion Internet active. Veuillez vous connecter au réseau pour continuer."
  },
  de: {
    title: "Hallo!",
    subtitle: "Wie kann ich Ihnen heute helfen?",
    placeholder: "Frag mich etwas...",
    thinking: "Denken...",
    thoughtToggle: "Gedanken",
    settings: "Einstellungen",
    language: "Sprache",
    theme: "Thema",
    light: "Hell",
    dark: "Dunkel",
    system: "System",
    version: "Version 1.0",
    error: "Netzwerkfehler",
    errorPrefix: "Fehler:",
    copy: "Kopieren",
    attach: "Bild anhängen",
    enableThoughts: "Gedanken anzeigen",
    attachPhoto: "Foto & Video",
    attachFile: "Datei hochladen",
    attachCamera: "Foto machen",
    attachScan: "Dokument scannen",
    offlineTitle: "Keine Internetverbindung",
    offlineDesc: "Solvexa erfordert eine aktive Internetverbindung. Bitte verbinden Sie sich mit dem Netzwerk."
  }
};

type Language = keyof typeof TRANSLATIONS;
type Theme = 'light' | 'dark' | 'system';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  thought?: string;
  timeTakenMs?: number;
  status?: 'thinking' | 'typing' | 'done';
  images?: string[];
}

function CopyButton({ text, title }: { text: string, title: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleCopy} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors" title={title}>
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function RobotFace({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1254 1254" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7EC1F7"/>
          <stop offset="100%" stopColor="#2F86F6"/>
        </linearGradient>
      </defs>

      {/* Left ear */}
      <rect x="99" y="502" width="76" height="235" rx="38" fill="url(#blueGrad)"/>
      {/* Right ear */}
      <rect x="1078" y="502" width="77" height="235" rx="38" fill="url(#blueGrad)"/>

      {/* Head outline */}
      <rect x="237" y="340" width="779" height="572" rx="286"
            fill="none" stroke="url(#blueGrad)" strokeWidth="78"/>

      {/* Eyes */}
      <g className="eyes-anim">
        <rect className="eye-anim left" x="419" y="539" width="78" height="162" rx="39" fill="url(#blueGrad)"/>
        <rect className="eye-anim right" x="757" y="539" width="77" height="162" rx="38.5" fill="url(#blueGrad)"/>
      </g>
    </svg>
  );
}

function AIThought({ thought, timeTakenMs, t }: { thought: string, timeTakenMs?: number, t: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-2 text-sm bg-transparent rounded-xl overflow-hidden">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full p-2 text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-1.5 font-medium text-xs uppercase tracking-wider">
          <RobotFace className="w-4 h-4" />
          {t.thoughtToggle}
        </div>
        <div className="flex items-center gap-2">
          {timeTakenMs && (
            <span className="flex items-center gap-1 text-[10px] text-blue-400 font-mono">
              <Clock className="w-3 h-3" />
              {(timeTakenMs / 1000).toFixed(1)}s
            </span>
          )}
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-mono whitespace-pre-wrap">
              {thought}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HTMLPreview({ html }: { html: string }) {
  const [show, setShow] = useState(false);
  
  if (!show) {
    return (
      <div className="mt-4 border border-slate-200 dark:border-[#383838] rounded-xl p-4 bg-slate-50 dark:bg-[#282828] flex flex-col items-center justify-center gap-3">
        <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">HTML Code Generated</div>
        <button onClick={() => setShow(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
          <Play className="w-4 h-4" /> Run HTML
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 border border-slate-200 dark:border-[#383838] rounded-xl overflow-hidden h-96 relative flex flex-col">
      <div className="bg-slate-100 dark:bg-[#282828] p-2 flex justify-end border-b border-slate-200 dark:border-[#383838] shrink-0">
        <button onClick={() => setShow(false)} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">Close Preview</button>
      </div>
      <iframe srcDoc={html} className="w-full flex-1 bg-white" title="HTML Preview" sandbox="allow-scripts allow-modals allow-forms" />
    </div>
  );
}

function ParsedMessage({ text, status }: { text: string, status?: string }) {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none prose-sm sm:prose-base prose-pre:bg-slate-900 prose-pre:p-0 prose-pre:m-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props) {
            const {children, className, node, ...rest} = props
            const match = /language-(\w+)/.exec(className || '')
            const isHtml = match && match[1] === 'html';
            const codeContent = String(children).replace(/\n$/, '');

            if (!className) {
              return <code className="bg-slate-100 dark:bg-[#282828] px-1.5 py-0.5 rounded text-sm font-mono text-blue-600 dark:text-blue-400" {...rest}>{children}</code>
            }

            return (
              <div className="my-4 rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700/50">
                  <span className="text-xs font-mono text-slate-400">{match ? match[1] : 'code'}</span>
                  <CopyButton text={codeContent} title="Copy" />
                </div>
                <pre className="p-4 overflow-x-auto text-sm text-slate-50 m-0 bg-transparent">
                  <code className={className} {...rest}>
                    {children}
                  </code>
                </pre>
                {isHtml && (
                  <HTMLPreview html={codeContent} />
                )}
              </div>
            )
          }
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [language, setLanguage] = useState<Language>('ru');
  const [theme, setTheme] = useState<Theme>('system');
  const [showSettings, setShowSettings] = useState(false);
  const [showThoughts, setShowThoughts] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const attachButtonRef = useRef<HTMLButtonElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const t = TRANSLATIONS[language];

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // Initialize spatial navigation after loading finishes
      SpatialNavigation.init();
      
      // Set the class for focused elements
      SpatialNavigation.set({
        focusedClassName: 'sn-focused',
        enterTo: 'click' // trigger click on enter
      });

      SpatialNavigation.add({
        selector: 'button, input, select, [tabindex="0"]'
      });
      SpatialNavigation.makeFocusable();
      SpatialNavigation.focus();
    }, 3000);
    
    return () => {
      clearTimeout(timer);
      SpatialNavigation.uninit();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node) &&
          attachButtonRef.current && !attachButtonRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    if (showAttachMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAttachMenu]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Mark as using keyboard/remote
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
        document.documentElement.classList.add('using-keyboard');
      }

      // If ArrowDown is pressed and settings modal is closed
      if (e.key === 'ArrowDown' && !showSettings) {
        const active = document.activeElement;
        // Don't interrupt if we are already typing in an input
        if (!active || (active.tagName !== 'INPUT' && active.tagName !== 'SELECT' && active.tagName !== 'TEXTAREA')) {
          e.preventDefault(); // prevent default scroll
          chatInputRef.current?.focus();
        }
      }
    };

    const handleMouseDown = () => {
      // Mark as using mouse, so remove keyboard outline highlight
      document.documentElement.classList.remove('using-keyboard');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [showSettings]);

  useEffect(() => {
    const updateTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    updateTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => updateTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAttachedImages(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (isTyping) return;
    if (!input.trim() && attachedImages.length === 0) return;

    const currentInput = input;
    const currentImages = attachedImages;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: currentInput, images: currentImages };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachedImages([]);
    setIsTyping(true);

    const aiMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', text: '', status: 'thinking' }]);

    try {
      const appUrl = (import.meta as any).env.VITE_APP_URL || '';
      const apiBase = appUrl ? (appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl) : '';
      const res = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentInput, images: currentImages, language })
      });

      if (!res.ok) {
        throw new Error(t.error);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6).trim();
            if (!dataStr) continue;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.error) throw new Error(data.error);
              if (data.done) {
                setMessages(prev => prev.map(msg => 
                  msg.id === aiMsgId ? { ...msg, timeTakenMs: data.timeTakenMs, status: 'done' } : msg
                ));
                continue;
              }
              
              fullText += data.text;
              
              let parsedThought = '';
              let parsedAnswer = '';
              let currentStatus: 'thinking' | 'typing' = 'thinking';

              if (fullText.includes('<think>')) {
                  const startIndex = fullText.indexOf('<think>') + 7;
                  const endIndex = fullText.indexOf('</think>');
                  if (endIndex !== -1) {
                      parsedThought = fullText.slice(startIndex, endIndex).trim();
                      parsedAnswer = fullText.slice(endIndex + 9).trim();
                      currentStatus = 'typing';
                  } else {
                      parsedThought = fullText.slice(startIndex).trim();
                      currentStatus = 'thinking';
                  }
              } else {
                  parsedAnswer = fullText.trim();
                  currentStatus = 'typing';
              }

              setMessages(prev => prev.map(msg => 
                msg.id === aiMsgId 
                  ? { ...msg, text: parsedAnswer, thought: parsedThought, status: currentStatus }
                  : msg
              ));
            } catch (e) {
              console.error("Parse error", e, dataStr);
            }
          }
        }
      }
    } catch (error: any) {
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId 
          ? { ...msg, text: `${t.errorPrefix} ${error.message}`, status: 'done' }
          : msg
      ));
    } finally {
      setIsTyping(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[100dvh] w-full bg-slate-50 dark:bg-[#1c1c1c] flex flex-col items-center justify-center relative overflow-hidden text-slate-800 dark:text-white font-sans transition-colors duration-300">
        <div className="absolute inset-0 pointer-events-none opacity-50 dark:opacity-100" style={{
          backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(255,120,180,0.08), transparent 8%), radial-gradient(circle at 80% 70%, rgba(120,200,255,0.06), transparent 12%)'
        }} />
        
        <div className="flex-1 flex flex-col items-center justify-center z-10 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center justify-center text-center p-8"
          >
            <motion.div
              animate={{ 
                y: [0, -10, 0],
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <RobotFace className="w-16 h-16 mb-6 text-blue-500 dark:text-blue-400" />
            </motion.div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white/90">Solvexa</h2>
          </motion.div>
        </div>

        <div className="absolute bottom-6 w-full text-center z-10">
          <span className="text-[10px] font-mono tracking-[0.2em] text-slate-400 dark:text-white/40 uppercase">Faltron</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-white dark:bg-[#1c1c1c] flex flex-col overflow-hidden relative font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Full screen liquid morphing background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-40 dark:opacity-20">
        <div className="liquid-card-bg" style={{
          background: 'radial-gradient(circle at 30% 30%, #3b82f6 0%, transparent 40%), radial-gradient(circle at 75% 65%, #06b6d4 0%, transparent 40%)',
          filter: 'url(#liquid)'
        }} />
      </div>

      {/* Offline state overlay card */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-md bg-white dark:bg-[#282828] rounded-3xl shadow-2xl border border-slate-100 dark:border-[#383838] p-8 text-center flex flex-col items-center relative overflow-hidden"
            >
              {/* Animated liquid backdrop in the card */}
              <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10">
                <div className="liquid-card-bg" style={{
                  background: 'radial-gradient(circle at 50% 50%, #ef4444 0%, transparent 50%)',
                  filter: 'url(#liquid)'
                }} />
              </div>

              <div className="relative z-10">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-950/40 text-red-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <WifiOff className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">
                  {t.offlineTitle}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                  {t.offlineDesc}
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-[#1c1c1c] text-xs font-mono text-slate-500 dark:text-slate-400 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  offline mode active
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Toggle */}
      <button 
        onClick={() => setShowSettings(!showSettings)}
        className="absolute top-4 right-4 z-30 p-2 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-[#282828] focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full transition-colors"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm mx-4 bg-white dark:bg-[#282828] rounded-3xl shadow-2xl border border-slate-100 dark:border-[#383838] p-6 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">{t.settings}</h3>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#383838] focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t.language}</label>
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="w-full bg-slate-50 dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#383838] text-[15px] rounded-xl p-3 outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t.theme}</label>
                  <div className="flex bg-slate-100 dark:bg-[#1c1c1c] p-1 rounded-xl">
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'light' ? 'bg-white dark:bg-[#282828] text-blue-500 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                      <Sun className="w-4 h-4" /> {t.light}
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-white dark:bg-[#282828] text-blue-500 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                      <Moon className="w-4 h-4" /> {t.dark}
                    </button>
                    <button
                      onClick={() => setTheme('system')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'system' ? 'bg-white dark:bg-[#282828] text-blue-500 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                      <Monitor className="w-4 h-4" /> {t.system}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <label className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t.enableThoughts}</label>
                  <button
                    type="button"
                    onClick={() => setShowThoughts(!showThoughts)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full px-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-[#1c1c1c] ${showThoughts ? 'bg-blue-500' : 'bg-slate-200 dark:bg-[#383838]'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${showThoughts ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-[#383838]/50 flex justify-center">
                <span className="text-xs text-slate-400 font-mono tracking-wider bg-slate-50 dark:bg-[#1c1c1c]/50 px-3 py-1 rounded-full">{t.version}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="absolute inset-0 overflow-y-auto scroll-smooth z-0">
        <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 md:p-8 flex flex-col gap-6 min-h-full pt-20 pb-40 relative">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent mb-4 tracking-tight">
                  {t.title}
                </h2>
                <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
                  {t.subtitle}
                </p>
              </motion.div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex flex-col max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
                >
                  {msg.status === 'thinking' ? (
                    <div className="flex flex-col gap-2 p-4 bg-transparent text-sm text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-3 text-blue-500 font-medium">
                        <RobotFace className="w-8 h-8" />
                        <span className="animate-pulse tracking-wide">{t.thinking}</span>
                      </div>
                      {showThoughts && msg.thought && (
                        <div className="font-mono text-xs opacity-70 whitespace-pre-wrap leading-relaxed mt-2">
                           {msg.thought}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`group relative p-4 text-[15px] leading-relaxed w-full ${
                      msg.role === 'user' 
                        ? 'bg-transparent text-slate-800 dark:text-slate-200' 
                        : 'bg-transparent text-slate-700 dark:text-slate-300'
                    }`}>
                      {msg.images && msg.images.length > 0 && (
                        <div className={`flex flex-wrap gap-2 mb-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                          {msg.images.map((img, i) => (
                            <img key={i} src={img} alt="Attachment" className="max-w-[200px] max-h-[200px] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm" />
                          ))}
                        </div>
                      )}
                      
                      {msg.role === 'ai' ? (
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 whitespace-pre-wrap">
                            <ParsedMessage text={msg.text} status={msg.status} />
                          </div>
                          {msg.status === 'done' && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <CopyButton text={msg.text} title={t.copy} />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-right whitespace-pre-wrap">{msg.text}</div>
                      )}
                    </div>
                  )}
                  
                  {showThoughts && msg.thought && msg.status !== 'thinking' && (
                    <div className="w-full mt-1">
                      <AIThought thought={msg.thought} timeTakenMs={msg.timeTakenMs} t={t} />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>
 
      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 sm:p-6 md:p-8 bg-transparent transition-colors duration-300">
        <div className="max-w-3xl mx-auto w-full">
          {/* Image Previews */}
          {attachedImages.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
              {attachedImages.map((img, idx) => {
                const isImage = img.startsWith('data:image/');
                return (
                  <div key={idx} className="relative group shrink-0">
                    {isImage ? (
                      <img src={img} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-slate-200 dark:border-[#383838]" />
                    ) : (
                      <div className="h-16 w-16 bg-slate-50 dark:bg-[#282828] rounded-lg border border-slate-200 dark:border-[#383838] flex items-center justify-center">
                        <File className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                    <button 
                      onClick={() => removeImage(idx)}
                      disabled={isTyping}
                      className="absolute -top-2 -right-2 p-1 bg-slate-800 dark:bg-slate-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md disabled:hidden"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="relative flex items-center"
          >
            {/* Hidden Inputs */}
            <input type="file" accept="image/*,video/*" multiple className="hidden" ref={photoInputRef} onChange={handleFileChange} />
            <input type="file" accept="*" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileChange} />
            <input type="file" accept="image/*" capture="environment" className="hidden" ref={scanInputRef} onChange={handleFileChange} />
 
            <div className="relative">
              <AnimatePresence>
                {showAttachMenu && !isTyping && (
                  <motion.div 
                    ref={attachMenuRef}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-0 mb-4 w-64 bg-white dark:bg-[#282828] rounded-2xl shadow-xl border border-slate-100 dark:border-[#383838] p-2 flex flex-col gap-1 z-20"
                  >
                    <button type="button" onClick={() => { setShowAttachMenu(false); photoInputRef.current?.click(); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus:ring-0 dark:hover:bg-[#383838] dark:focus:bg-[#383838] rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors w-full text-left">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-lg"><ImageIcon className="w-4 h-4" /></div>
                      {t.attachPhoto}
                    </button>
                    <button type="button" onClick={() => { setShowAttachMenu(false); fileInputRef.current?.click(); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus:ring-0 dark:hover:bg-[#383838] dark:focus:bg-[#383838] rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors w-full text-left">
                      <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-500 rounded-lg"><File className="w-4 h-4" /></div>
                      {t.attachFile}
                    </button>
                    <button type="button" onClick={() => { setShowAttachMenu(false); cameraInputRef.current?.click(); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus:ring-0 dark:hover:bg-[#383838] dark:focus:bg-[#383838] rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors w-full text-left">
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-lg"><Camera className="w-4 h-4" /></div>
                      {t.attachCamera}
                    </button>
                    <button type="button" onClick={() => { setShowAttachMenu(false); scanInputRef.current?.click(); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus:ring-0 dark:hover:bg-[#383838] dark:focus:bg-[#383838] rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors w-full text-left">
                      <div className="p-2 bg-orange-50 dark:bg-orange-900/30 text-orange-500 rounded-lg"><Scan className="w-4 h-4" /></div>
                      {t.attachScan}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
 
              <button
                ref={attachButtonRef}
                type="button"
                onClick={() => !isTyping && setShowAttachMenu(!showAttachMenu)}
                disabled={isTyping}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-[#383838] focus:outline-none rounded-full transition-colors z-10 disabled:opacity-40 disabled:pointer-events-none"
                title={t.attach}
              >
                <Paperclip className="w-5 h-5" />
              </button>
            </div>
 
            <input
              ref={chatInputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={t.placeholder}
              disabled={isTyping}
              className="w-full liquid-input border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-[15px] rounded-full pl-14 pr-14 py-4 focus:outline-none focus:ring-0 focus:border-slate-200 dark:focus:border-white/10 focus-visible:ring-0 focus-visible:outline-none outline-none ring-0 transition-all placeholder:text-slate-400 dark:placeholder:text-white/50 shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            />
            <button
              type="submit"
              disabled={(!input.trim() && attachedImages.length === 0) || isTyping}
              className="absolute right-2 p-2.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-sm shadow-blue-500/20"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

