
import React, { useState, useEffect } from 'react';
import { NavSection, NPC, MJSonSection, AdminSubSection, SessionSubSection, UserState, Project, Partner, GalleryImage, ShopItem, SiteBranding, UpcomingSession, Account, UserRole } from './types';
import { DISCORD_LINK, HELLOASSO_WIDGET_URL, EYE_OF_DARKNESS_URL, FORMS_APP_RESULTS_URL, FORM_INSCRIPTION_URL, FORM_AVIS_URL, BALDIUS_IMAGE, Icons, ADVENTURE_LOCATIONS_URL, ASSISTANT_OEIL_NOIR, ASSISTANT_CHTULU, ASSISTANT_WALKING_DEAD, ASSISTANT_PENDRAGON, ASSISTANT_DND } from './constants';
import { generateAdventureIdea, generateNPC } from './geminiService';
import { AdventureIdea } from './types';

const DEFAULT_SHOP: ShopItem[] = [];
const DEFAULT_BRANDING: SiteBranding = {
  logo: BALDIUS_IMAGE,
  heroBg: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
  aboutOverlay: "https://images.unsplash.com/photo-1533230392657-d67a73b31f77?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
};

const App: React.FC = () => {
  // Navigation & UI States
  const [activeSection, setActiveSection] = useState<NavSection>(NavSection.Home);
  const [adminSubSection, setAdminSubSection] = useState<AdminSubSection>(AdminSubSection.Results);
  const [sessionSubSection, setSessionSubSection] = useState<SessionSubSection>(SessionSubSection.Signup);
  const [mjSubSection, setMjSubSection] = useState<MJSonSection>(MJSonSection.Generator);
  const [mjIframeUrl, setMjIframeUrl] = useState<string>(EYE_OF_DARKNESS_URL);
  const [aboutExtraInfo, setAboutExtraInfo] = useState<'projects' | 'partners' | null>(null);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<GalleryImage | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auth States
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authInviteCode, setAuthInviteCode] = useState('');
  const [user, setUser] = useState<UserState>({ isLoggedIn: false, role: 'guest', name: '' });

  // Data Persistence States
  const [accounts, setAccounts] = useState<Account[]>(() => JSON.parse(localStorage.getItem('baldius_accounts_v1') || '[]'));
  const [projects, setProjects] = useState<Project[]>(() => JSON.parse(localStorage.getItem('baldius_projects_v2') || '[]'));
  const [partners, setPartners] = useState<Partner[]>(() => JSON.parse(localStorage.getItem('baldius_partners_v2') || '[]'));
  const [shopItems, setShopItems] = useState<ShopItem[]>(() => JSON.parse(localStorage.getItem('baldius_shop_v2') || JSON.stringify(DEFAULT_SHOP)));
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(() => JSON.parse(localStorage.getItem('baldius_gallery_v2') || '[]'));
  const [branding, setBranding] = useState<SiteBranding>(() => JSON.parse(localStorage.getItem('baldius_branding_v2') || JSON.stringify(DEFAULT_BRANDING)));
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>(() => JSON.parse(localStorage.getItem('baldius_sessions_v2') || '[]'));

  // Form States
  const [shopForm, setShopForm] = useState<Omit<ShopItem, 'id'>>({ name: '', price: '', description: '', image: '', link: '' });
  const [galleryForm, setGalleryForm] = useState<Omit<GalleryImage, 'id'>>({ title: '', url: '' });
  const [projectForm, setProjectForm] = useState<Omit<Project, 'id'>>({ title: '', description: '', link: '' });
  const [partnerForm, setPartnerForm] = useState<Omit<Partner, 'id'>>({ name: '', description: '', link: '' });
  const [upcomingSessionForm, setUpcomingSessionForm] = useState<Omit<UpcomingSession, 'id'>>({
    title: '', system: '', date: '', gm: '', description: '', banner: '', discordLink: DISCORD_LINK, isFull: false
  });

  // Persistence
  useEffect(() => { localStorage.setItem('baldius_accounts_v1', JSON.stringify(accounts)); }, [accounts]);
  useEffect(() => { localStorage.setItem('baldius_projects_v2', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('baldius_partners_v2', JSON.stringify(partners)); }, [partners]);
  useEffect(() => { localStorage.setItem('baldius_shop_v2', JSON.stringify(shopItems)); }, [shopItems]);
  useEffect(() => { localStorage.setItem('baldius_gallery_v2', JSON.stringify(galleryImages)); }, [galleryImages]);
  useEffect(() => { localStorage.setItem('baldius_branding_v2', JSON.stringify(branding)); }, [branding]);
  useEffect(() => { localStorage.setItem('baldius_sessions_v2', JSON.stringify(upcomingSessions)); }, [upcomingSessions]);

  useEffect(() => {
    if (user.isLoggedIn) setUpcomingSessionForm(prev => ({ ...prev, gm: user.name }));
  }, [user]);

  // Auth
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (accounts.find(a => a.username.toLowerCase() === authUsername.toLowerCase())) {
      alert("Ce nom d'aventurier est déjà pris !");
      return;
    }
    let role: UserRole = 'member';
    const code = authInviteCode.toLowerCase().trim();
    if (code === 'caverne') role = 'mj';
    if (code === 'genevieve') role = 'admin';

    const newAccount: Account = { username: authUsername, passwordHash: authPassword, role };
    setAccounts([...accounts, newAccount]);
    alert(`Compte créé avec succès ! Sceau : ${role.toUpperCase()}.`);
    setAuthTab('login');
    setAuthPassword('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const account = accounts.find(a => a.username.toLowerCase() === authUsername.toLowerCase() && a.passwordHash === authPassword);
    if (account) {
      setUser({ isLoggedIn: true, role: account.role, name: account.username });
      setIsLoginModalOpen(false);
      setAuthPassword('');
      setAuthUsername('');
    } else {
      alert("Identifiants incorrects.");
    }
  };

  const handleLogout = () => { setUser({ isLoggedIn: false, role: 'guest', name: '' }); setActiveSection(NavSection.Home); };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 2 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result as string);
      reader.readAsDataURL(file);
    } else if (file) alert("Max 2Mo");
  };

  const [idea, setIdea] = useState<AdventureIdea | null>(null);
  const [loadingIdea, setLoadingIdea] = useState(false);
  const [npc, setNpc] = useState<NPC | null>(null);
  const [loadingNpc, setLoadingNpc] = useState(false);

  const handleGenerateIdea = async () => {
    setLoadingIdea(true);
    try { setIdea(await generateAdventureIdea("Médiéval Fantastique")); } finally { setLoadingIdea(false); }
  };

  const handleGenerateNPC = async () => {
    setLoadingNpc(true);
    try { setNpc(await generateNPC("Taverne obscure")); } finally { setLoadingNpc(false); }
  };

  const handleNavClick = (sectionId: NavSection, isProtected: boolean = false, minRole: UserRole = 'member') => {
    if (isProtected) {
      if (!user.isLoggedIn) setIsLoginModalOpen(true);
      else if (user.role !== 'admin' && (minRole === 'admin' || (minRole === 'mj' && user.role !== 'mj'))) {
        alert("Accès réservé aux Maîtres de Jeu.");
      } else setActiveSection(sectionId);
    } else setActiveSection(sectionId);
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const newSession: UpcomingSession = { ...upcomingSessionForm, id: `session-${Date.now()}` };
    setUpcomingSessions([newSession, ...upcomingSessions]);
    setUpcomingSessionForm({ title: '', system: '', date: '', gm: user.name, description: '', banner: '', discordLink: DISCORD_LINK, isFull: false });
    setMjSubSection(MJSonSection.Planning);
  };

  const handleDeleteSession = (id: string) => {
    if (window.confirm("Voulez-vous vraiment clore cette table définitivement ?")) {
      setUpcomingSessions(upcomingSessions.filter(s => s.id !== id));
      if (currentSlide >= upcomingSessions.length - 1) setCurrentSlide(0);
    }
  };

  const openAssistantPopup = (url: string) => {
    const width = 800;
    const height = 900;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    window.open(url, 'AssistantBaldius', `width=${width},height=${height},top=${top},left=${left},menubar=no,status=no,toolbar=no,scrollbars=yes`);
  };

  const pendingSessions = upcomingSessions.filter(s => !s.isFull);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % pendingSessions.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + pendingSessions.length) % pendingSessions.length);

  return (
    <div className="min-h-screen flex flex-col bg-[#1c1917] text-[#fef3c7]">
      <nav className="sticky top-0 z-50 bg-[#1c1917]/95 backdrop-blur-md border-b border-[#8a4b2d]/50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveSection(NavSection.Home)}>
            <img src={branding.logo} alt="Logo" className="w-12 h-12 rounded-full border-2 border-[#fbbf24] object-cover" />
            <div className="flex flex-col">
              <span className="font-fantasy text-lg font-bold text-[#fbbf24] uppercase leading-none">La Caverne</span>
              <span className="text-[10px] text-[#d4b08c] font-bold tracking-widest uppercase">de Baldius</span>
            </div>
          </div>
          <div className="hidden lg:flex items-center space-x-1">
            {[
              { id: NavSection.Home, label: 'Entrée' },
              { id: NavSection.About, label: 'Histoire' },
              { id: NavSection.Gallery, label: 'Galerie' },
              { id: NavSection.Shop, label: 'Trésors' },
              { id: NavSection.Membership, label: 'Adhésion' },
              { id: NavSection.Sessions, label: 'Inscriptions' },
              { id: NavSection.MJ, label: 'Antre MJ', protected: true, minRole: 'mj' },
              { id: NavSection.Admin, label: 'Intendance', protected: true, minRole: 'admin' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id as NavSection, item.protected, (item.minRole || 'member') as UserRole)}
                className={`px-3 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all ${
                  activeSection === item.id ? 'bg-[#8a4b2d] text-white shadow-lg' : 'text-[#d4b08c] hover:text-[#fbbf24]'
                }`}
              >
                {item.label}
              </button>
            ))}
            {user.isLoggedIn ? (
              <div className="flex items-center gap-4 ml-4">
                 <div className="flex flex-col text-right">
                    <span className="text-[9px] font-black text-[#fbbf24] uppercase">{user.role}</span>
                    <span className="text-xs font-bold text-[#fef3c7]">{user.name}</span>
                 </div>
                 <button onClick={handleLogout} className="bg-red-900/20 text-red-400 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors">Quitter</button>
              </div>
            ) : (
              <button onClick={() => { setAuthTab('login'); setIsLoginModalOpen(true); }} className="ml-4 bg-[#fbbf24] text-[#1c1917] px-4 py-2 rounded-lg text-[10px] font-black uppercase shadow-lg hover:scale-105 transition-all">S'identifier</button>
            )}
          </div>
        </div>
      </nav>

      {/* AUTH MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="parchment-card p-0 rounded-[2.5rem] max-w-sm w-full border-4 border-[#8a4b2d]/40 relative overflow-hidden">
             <button onClick={() => setIsLoginModalOpen(false)} className="absolute top-6 right-6 text-[#d4b08c] z-10"><Icons.ArrowLeft /></button>
             <div className="flex bg-[#1c1917] border-b border-[#8a4b2d]/30">
                <button onClick={() => setAuthTab('login')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest ${authTab === 'login' ? 'bg-[#8a4b2d] text-white' : 'text-[#d4b08c]'}`}>Connexion</button>
                <button onClick={() => setAuthTab('signup')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest ${authTab === 'signup' ? 'bg-[#8a4b2d] text-white' : 'text-[#d4b08c]'}`}>Inscription</button>
             </div>
             <div className="p-10 text-center space-y-6">
                <h3 className="text-2xl font-fantasy font-bold text-[#fbbf24] uppercase">{authTab === 'login' ? 'Identification' : 'Nouveau Registre'}</h3>
                <form onSubmit={authTab === 'login' ? handleLogin : handleSignup} className="space-y-4">
                  <input type="text" placeholder="Nom d'aventurier" value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} className="w-full bg-[#1c1917] border border-[#8a4b2d]/50 rounded-xl px-4 py-4 text-[#fde68a] font-bold outline-none" required />
                  <input type="password" placeholder="Mot de passe" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full bg-[#1c1917] border border-[#8a4b2d]/50 rounded-xl px-4 py-4 text-[#fde68a] font-bold outline-none" required />
                  {authTab === 'signup' && (
                    <input type="password" placeholder="code à demander sur le serveur" value={authInviteCode} onChange={(e) => setAuthInviteCode(e.target.value)} className="w-full bg-[#1c1917] border border-[#fbbf24]/20 rounded-xl px-4 py-3 text-[#fbbf24] text-xs font-bold outline-none" />
                  )}
                  <button type="submit" className="w-full bg-[#fbbf24] text-[#1c1917] py-4 rounded-xl font-black uppercase shadow-xl">
                    {authTab === 'login' ? 'Entrer' : 'Valider'}
                  </button>
                </form>
             </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX GALLERY */}
      {selectedGalleryImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md" onClick={() => setSelectedGalleryImage(null)}>
           <div className="relative max-w-5xl w-full flex flex-col items-center gap-6" onClick={e => e.stopPropagation()}>
              <img src={selectedGalleryImage.url} alt={selectedGalleryImage.title} className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border-2 border-[#fbbf24]/20" />
              <h4 className="font-fantasy text-2xl text-[#fbbf24] uppercase tracking-widest">{selectedGalleryImage.title}</h4>
              <button onClick={() => setSelectedGalleryImage(null)} className="bg-[#fbbf24] text-[#1c1917] px-6 py-2 rounded-xl font-black uppercase">Fermer</button>
           </div>
        </div>
      )}

      <main className="flex-grow">
        {activeSection === NavSection.Home && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="py-32 relative overflow-hidden border-b border-[#8a4b2d]/30" style={{ backgroundImage: `linear-gradient(rgba(28, 25, 23, 0.8), rgba(28, 25, 23, 0.95)), url('${branding.heroBg}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div className="max-w-7xl mx-auto px-4 relative z-10 flex flex-col lg:flex-row items-center gap-16">
                <div className="flex-1 text-center lg:text-left space-y-12">
                  <div className="space-y-6">
                    <span className="bg-[#fbbf24]/10 text-[#fbbf24] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#fbbf24]/20">Association de Jeu de Rôle</span>
                    <h1 className="text-6xl md:text-8xl font-fantasy font-bold text-[#fbbf24] leading-tight">La Caverne de Baldius</h1>
                    <p className="text-xl md:text-3xl text-[#fde68a] font-light italic leading-relaxed max-w-2xl mx-auto lg:mx-0">"Osez franchir le seuil des profondeurs. Ici, vos récits deviennent légendes."</p>
                  </div>
                  <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                    <button onClick={() => setActiveSection(NavSection.Membership)} className="bg-[#fbbf24] text-[#1c1917] px-8 py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl flex items-center gap-3"><Icons.GuildSeal /> Rejoindre la Guilde</button>
                    <button onClick={() => setActiveSection(NavSection.Sessions)} className="bg-[#8a4b2d] text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl flex items-center gap-3"><Icons.Sword /> S'inscrire</button>
                    <button onClick={() => setActiveSection(NavSection.Gallery)} className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3"><Icons.Dice /> Galerie</button>
                  </div>
                </div>
                <img src={branding.logo} alt="Baldius" className="hidden lg:block w-[400px] h-auto rounded-[3rem] shadow-2xl border-4 border-[#fbbf24]/30 object-cover aspect-[3/4] rotate-2" />
              </div>
            </header>

            {pendingSessions.length > 0 && (
              <section className="bg-[#12100e] border-b border-[#8a4b2d]/30 relative py-20">
                <div className="max-w-7xl mx-auto px-4">
                   <div className="relative h-auto md:h-[500px] flex items-center overflow-hidden">
                      {pendingSessions.map((session, idx) => (
                        <div key={session.id} className={`transition-all duration-700 flex flex-col md:flex-row items-center gap-12 ${idx === currentSlide ? 'opacity-100 relative' : 'opacity-0 absolute pointer-events-none'}`}>
                           <div className="w-full md:w-[450px] aspect-square rounded-[2rem] overflow-hidden border-4 border-[#fbbf24]/20 shadow-2xl shrink-0">
                              <img src={session.banner || branding.heroBg} className="w-full h-full object-cover" alt={session.title} />
                           </div>
                           <div className="flex-1 space-y-8 text-center md:text-left">
                              <div className="flex gap-4 justify-center md:justify-start">
                                 <span className="bg-[#fbbf24] text-[#1c1917] px-3 py-1 rounded-full text-[9px] font-black uppercase">{session.system}</span>
                                 <span className="text-[#fbbf24] text-[9px] font-black uppercase border border-[#fbbf24]/30 px-3 py-1 rounded-full">{session.date}</span>
                              </div>
                              <h2 className="text-3xl md:text-5xl font-fantasy text-white uppercase">{session.title}</h2>
                              <p className="text-[#d4b08c] italic text-lg leading-relaxed line-clamp-4">"{session.description}"</p>
                              <div className="flex items-center gap-4 justify-center md:justify-start">
                                 <div className="w-12 h-12 bg-[#8a4b2d] rounded-full flex items-center justify-center font-fantasy text-white text-xl border-2 border-[#fbbf24]/20 shadow-xl">{session.gm[0]}</div>
                                 <div className="text-left text-sm"><span className="text-[9px] text-[#fbbf24] uppercase font-bold tracking-widest">Maître de Jeu</span><br /><span className="text-white font-fantasy">{session.gm}</span></div>
                              </div>
                              <button onClick={() => window.open(session.discordLink, '_blank')} className="bg-[#fbbf24] text-[#1c1917] px-10 py-5 rounded-2xl font-black uppercase shadow-2xl flex items-center gap-4 mx-auto md:mx-0">
                                 <Icons.Discord className="w-6 h-6" /> Rejoindre la Table
                              </button>
                           </div>
                        </div>
                      ))}
                      {pendingSessions.length > 1 && (
                        <div className="absolute inset-y-0 w-full flex justify-between items-center pointer-events-none px-4 md:px-0">
                          <button onClick={prevSlide} className="p-4 rounded-full bg-white/5 border border-white/10 text-white hover:bg-[#fbbf24] pointer-events-auto transition-all"><Icons.ArrowLeft /></button>
                          <button onClick={nextSlide} className="p-4 rounded-full bg-white/5 border border-white/10 text-white hover:bg-[#fbbf24] pointer-events-auto transition-all rotate-180"><Icons.ArrowLeft /></button>
                        </div>
                      )}
                   </div>
                </div>
              </section>
            )}

            <section className="py-24 border-t border-[#8a4b2d]/20">
              <div className="max-w-6xl mx-auto px-4">
                <div className="parchment-card p-12 md:p-20 rounded-[4rem] border-2 border-[#fbbf24]/10 text-center space-y-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5"><Icons.GuildSeal className="w-64 h-64 rotate-12" /></div>
                  <h2 className="text-4xl md:text-5xl font-fantasy font-bold text-[#fbbf24] uppercase tracking-tighter">L'Appel de la Guilde</h2>
                  <p className="text-[#d4b08c] text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                    Vous cherchez une table, des camarades d'aventure ou simplement un refuge pour vos lancers de dés ? Devenez membre officiel et soutenez la propagation du JdR.
                  </p>
                  <div className="grid md:grid-cols-3 gap-8 text-left max-w-4xl mx-auto py-8">
                    <div className="space-y-2"><h4 className="font-fantasy text-[#fbbf24]">Soutien Local</h4><p className="text-sm text-[#d4b08c]/70">Contribuez à l'organisation d'événements et au développement du jeu de rôle.</p></div>
                    <div className="space-y-2"><h4 className="font-fantasy text-[#fbbf24]">Accès Discord</h4><p className="text-sm text-[#d4b08c]/70">Rejoignez nos salons de coordination et trouvez vos futurs MJ.</p></div>
                    <div className="space-y-2"><h4 className="font-fantasy text-[#fbbf24]">Boutique Exclusive</h4><p className="text-sm text-[#d4b08c]/70">Accédez aux trésors et objets dérivés de l'association.</p></div>
                  </div>
                  <button onClick={() => setActiveSection(NavSection.Membership)} className="inline-flex items-center gap-3 bg-[#fbbf24] text-[#1c1917] px-12 py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">
                    Sceller mon adhésion <Icons.ArrowLeft className="rotate-180" />
                  </button>
                </div>
              </div>
            </section>

            <section className="py-24 border-t border-[#8a4b2d]/20">
              <div className="max-w-7xl mx-auto px-4 space-y-16">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 text-center md:text-left">
                  <div className="space-y-4">
                    <h2 className="text-4xl md:text-5xl font-fantasy font-bold text-[#fbbf24] uppercase">L'Étalage de Baldius</h2>
                    <p className="text-[#d4b08c] italic text-lg">"Des dés forgés dans les ombres aux parchemins de guilde."</p>
                  </div>
                  <button onClick={() => setActiveSection(NavSection.Shop)} className="bg-[#8a4b2d]/10 text-[#fbbf24] border border-[#fbbf24]/20 px-8 py-3 rounded-xl font-bold uppercase text-xs hover:bg-[#fbbf24] hover:text-[#1c1917] transition-all">Tout l'inventaire</button>
                </div>
                {shopItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {shopItems.slice(0, 4).map((item) => (
                      <div key={item.id} className="parchment-card rounded-3xl overflow-hidden group hover:border-[#fbbf24]/50 transition-all">
                        <div className="h-64 relative">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          <div className="absolute top-4 right-4 bg-[#fbbf24] text-[#1c1917] px-3 py-1 rounded-full font-black text-[10px]">{item.price}</div>
                        </div>
                        <div className="p-6 space-y-4 flex-grow flex flex-col justify-between">
                          <div className="space-y-2">
                             <h3 className="text-xl font-fantasy text-white group-hover:text-[#fbbf24]">{item.name}</h3>
                             {item.description && <p className="text-[10px] text-[#d4b08c]/70 line-clamp-2 italic">"{item.description}"</p>}
                          </div>
                          <button onClick={() => window.open(item.link, '_blank')} className="w-full bg-white/5 py-3 rounded-xl text-[10px] font-black uppercase group-hover:bg-white group-hover:text-black">Acquérir</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <div className="py-24 text-center parchment-card rounded-[3rem] border-dashed border-2 border-[#8a4b2d]/30 text-[#d4b08c]/40">Le tavernier n'a pas encore garni son étal...</div>}
              </div>
            </section>

            <section className="py-24 bg-[#12100e] border-t border-[#8a4b2d]/20">
              <div className="max-w-7xl mx-auto px-4 space-y-16">
                <div className="text-center space-y-4">
                  <h2 className="text-4xl md:text-5xl font-fantasy font-bold text-[#fbbf24] uppercase">Le Miroir des Souvenirs</h2>
                  <p className="text-[#d4b08c] italic text-lg">"Nos victoires, gravées dans la lumière."</p>
                </div>
                {galleryImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {galleryImages.slice(0, 5).map((img) => (
                      <div key={img.id} onClick={() => { setSelectedGalleryImage(img); }} className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group border-2 border-transparent hover:border-[#fbbf24]/40 transition-all shadow-xl">
                        <img src={img.url} alt={img.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-[10px] font-black uppercase text-[#fbbf24]">{img.title}</span></div>
                      </div>
                    ))}
                    <div onClick={() => setActiveSection(NavSection.Gallery)} className="aspect-square rounded-2xl bg-[#1c1917] border-2 border-dashed border-[#8a4b2d]/30 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-[#8a4b2d]/10 transition-all">
                       <Icons.Dice className="text-[#fbbf24] w-10 h-10" />
                       <span className="text-[9px] font-black uppercase text-[#fbbf24]">Voir plus</span>
                    </div>
                  </div>
                ) : <div className="py-12 text-center text-[#d4b08c]/40 italic">L'album attend vos récits...</div>}
              </div>
            </section>
          </div>
        )}

        {/* HISTOIRE SECTION */}
        {activeSection === NavSection.About && (
          <div className="max-w-6xl mx-auto px-4 py-24 space-y-24 animate-in fade-in duration-1000">
            {/* Intro Lore */}
            <div className="parchment-card p-12 md:p-24 rounded-[4rem] border-2 border-[#8a4b2d]/30 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><Icons.Scroll className="w-64 h-64 -rotate-12" /></div>
               <div className="space-y-12 relative z-10 text-center md:text-left">
                  <div className="space-y-6">
                    <h2 className="text-5xl md:text-7xl font-fantasy font-bold text-[#fbbf24] uppercase tracking-tighter">La Caverne de Baldius</h2>
                    <p className="text-2xl text-[#fbbf24]/80 font-bold italic">L'imaginaire comme boussole, les dés comme destin.</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-12 text-[#d4b08c] text-lg leading-relaxed">
                    <p>Fondée par une poignée de passionnés en quête d'aventures, La Caverne de Baldius est bien plus qu'une simple association. C'est un refuge pour tous ceux qui, entre deux lancers de dés, cherchent à forger des récits inoubliables.</p>
                    <p>Notre mission ? Démocratiser le jeu de rôle, offrir un espace de création pour les Maîtres de Jeu et bâtir une communauté soudée où chaque voix compte, quel que soit le système de jeu ou l'univers exploré.</p>
                  </div>
               </div>
            </div>

            {/* Values / Pillars Section */}
            <div className="grid md:grid-cols-3 gap-8">
               {[
                 { icon: <Icons.Users />, title: "Le Partage", desc: "Transmission des savoirs entre MJ, aide aux débutants et sessions découvertes pour tous." },
                 { icon: <Icons.GuildSeal />, title: "L'Inclusion", desc: "Une guilde ouverte à tous les profils, sans distinction d'origine, de genre ou d'expérience." },
                 { icon: <Icons.Sparkles />, title: "La Créativité", desc: "Développement d'outils, de scénarios originaux et promotion du 'Homebrew' maison." }
               ].map((pillar, i) => (
                 <div key={i} className="parchment-card p-10 rounded-[2.5rem] border border-[#fbbf24]/10 text-center space-y-4 hover:border-[#fbbf24]/40 transition-all group">
                    <div className="w-16 h-16 bg-[#fbbf24]/10 text-[#fbbf24] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">{pillar.icon}</div>
                    <h3 className="text-2xl font-fantasy text-[#fbbf24] uppercase">{pillar.title}</h3>
                    <p className="text-[#d4b08c]/80 text-sm leading-relaxed">{pillar.desc}</p>
                 </div>
               ))}
            </div>

            {/* Dynamic Content Toggle (Projects/Partners) */}
            <div className="space-y-12">
               <div className="flex flex-wrap gap-4 justify-center">
                 <button onClick={() => setAboutExtraInfo(aboutExtraInfo === 'projects' ? null : 'projects')} className={`px-10 py-5 rounded-2xl font-black uppercase tracking-widest border-2 transition-all shadow-xl ${aboutExtraInfo === 'projects' ? 'bg-[#fbbf24] text-[#1c1917] border-[#fbbf24]' : 'text-[#fbbf24] border-[#fbbf24]/40 hover:border-[#fbbf24]'}`}>
                    Nos Projets en cours
                 </button>
                 <button onClick={() => setAboutExtraInfo(aboutExtraInfo === 'partners' ? null : 'partners')} className={`px-10 py-5 rounded-2xl font-black uppercase tracking-widest border-2 transition-all shadow-xl ${aboutExtraInfo === 'partners' ? 'bg-[#fbbf24] text-[#1c1917] border-[#fbbf24]' : 'text-[#fbbf24] border-[#fbbf24]/40 hover:border-[#fbbf24]'}`}>
                    Nos Alliés de la Guilde
                 </button>
               </div>

               {aboutExtraInfo === 'projects' && (
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-500">
                   {projects.length > 0 ? projects.map(p => (
                     <div key={p.id} className="parchment-card p-8 rounded-3xl border border-[#fbbf24]/10 space-y-4 flex flex-col justify-between">
                       <div className="space-y-4">
                         <h4 className="text-xl font-fantasy text-[#fbbf24] border-b border-[#fbbf24]/20 pb-2">{p.title}</h4>
                         <p className="text-sm text-[#d4b08c] leading-relaxed">{p.description}</p>
                       </div>
                       {p.link && (
                         <button onClick={() => window.open(p.link, '_blank')} className="mt-4 bg-[#fbbf24]/10 text-[#fbbf24] px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-[#fbbf24] hover:text-[#1c1917] transition-all border border-[#fbbf24]/30">
                           <Icons.Heart className="w-3 h-3" /> Soutenir le projet
                         </button>
                       )}
                     </div>
                   )) : <p className="col-span-full text-center text-[#d4b08c]/40 italic py-12">Les chroniques de projets sont en cours de rédaction...</p>}
                 </div>
               )}

               {aboutExtraInfo === 'partners' && (
                 <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-500">
                   {partners.length > 0 ? partners.map(p => (
                     <div key={p.id} className="parchment-card p-6 rounded-3xl border border-[#fbbf24]/10 text-center group hover:bg-[#fbbf24]/5 transition-colors">
                       <div className="w-12 h-12 bg-[#8a4b2d]/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-[#fbbf24]"><Icons.Users /></div>
                       <h4 className="font-fantasy text-[#fbbf24] group-hover:text-white transition-colors">{p.name}</h4>
                       <p className="text-xs text-[#d4b08c]/70 mt-3 italic line-clamp-2">"{p.description}"</p>
                       {p.link && <button onClick={() => window.open(p.link, '_blank')} className="mt-4 text-[9px] font-black uppercase text-[#fbbf24]/60 hover:text-[#fbbf24]">Visiter l'allié</button>}
                     </div>
                   )) : <p className="col-span-full text-center text-[#d4b08c]/40 italic py-12">Le registre des alliés est vide pour le moment.</p>}
                 </div>
               )}
            </div>
          </div>
        )}

        {/* GALLERIE SECTION */}
        {activeSection === NavSection.Gallery && (
          <div className="max-w-7xl mx-auto px-4 py-24 animate-in fade-in">
            <h2 className="text-5xl font-fantasy text-[#fbbf24] text-center mb-16 uppercase">Galerie des Souvenirs</h2>
            {galleryImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                {galleryImages.map(img => (
                  <div key={img.id} onClick={() => setSelectedGalleryImage(img)} className="group relative cursor-pointer overflow-hidden rounded-2xl aspect-square border-2 border-transparent hover:border-[#fbbf24]/40 transition-all shadow-xl">
                    <img src={img.url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={img.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-[10px] font-black uppercase text-[#fbbf24]">{img.title}</span></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-32 text-center parchment-card rounded-[3rem] border-dashed border-2 border-[#8a4b2d]/30 text-[#d4b08c]/40 max-w-2xl mx-auto">
                 <Icons.Dice className="w-16 h-16 mx-auto mb-4 opacity-20" />
                 <p className="italic uppercase font-black text-xs">Le miroir est encore sombre... Aucune image enregistrée.</p>
              </div>
            )}
          </div>
        )}

        {/* BOUTIQUE SECTION */}
        {activeSection === NavSection.Shop && (
          <div className="max-w-7xl mx-auto px-4 py-24 space-y-16 animate-in fade-in">
            <h2 className="text-5xl font-fantasy font-bold text-[#fbbf24] text-center uppercase tracking-tighter">Les Trésors de la Caverne</h2>
            {shopItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {shopItems.map(item => (
                  <div key={item.id} className="parchment-card rounded-3xl overflow-hidden group flex flex-col border-2 border-transparent hover:border-[#fbbf24]/30 transition-all shadow-xl">
                    <div className="h-64 relative">
                      <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                      <div className="absolute top-4 right-4 bg-[#fbbf24] text-[#1c1917] px-3 py-1 rounded-full font-black text-[10px]">{item.price}</div>
                    </div>
                    <div className="p-6 space-y-4 flex-grow flex flex-col justify-between">
                      <div className="space-y-2">
                        <h3 className="text-xl font-fantasy text-white group-hover:text-[#fbbf24]">{item.name}</h3>
                        {item.description && <p className="text-xs text-[#d4b08c]/80 italic">"{item.description}"</p>}
                      </div>
                      <button onClick={() => window.open(item.link, '_blank')} className="w-full bg-[#fbbf24] text-[#1c1917] py-4 rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition-all">Acquérir via HelloAsso</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-32 text-center parchment-card rounded-[3rem] border-dashed border-2 border-[#8a4b2d]/30 text-[#d4b08c]/40 max-w-2xl mx-auto">
                 <Icons.Heart className="w-16 h-16 mx-auto mb-4 opacity-20" />
                 <p className="italic uppercase font-black text-xs">Le tavernier n'a pas encore garni son étal... Revenez plus tard !</p>
              </div>
            )}
          </div>
        )}

        {/* ADHESION SECTION */}
        {activeSection === NavSection.Membership && (
          <div className="max-w-4xl mx-auto px-4 py-24 animate-in fade-in">
             <div className="parchment-card p-12 rounded-[3rem] border-4 border-[#8a4b2d]/30 relative bg-[#2a221d] h-[900px] shadow-2xl overflow-hidden">
               <h2 className="text-4xl font-fantasy text-[#fbbf24] text-center uppercase mb-12">Sceller mon Adhésion</h2>
               <iframe src={HELLOASSO_WIDGET_URL} style={{ width: '100%', height: '80%', border: 'none' }} title="Adhésion" />
             </div>
          </div>
        )}

        {/* SESSIONS SECTION */}
        {activeSection === NavSection.Sessions && (
          <div className="max-w-7xl mx-auto px-4 py-24 space-y-8 animate-in fade-in">
            <div className="flex justify-center gap-4">
              <button onClick={() => setSessionSubSection(SessionSubSection.Signup)} className={`px-6 py-3 rounded-xl font-black uppercase text-[10px] transition-all ${sessionSubSection === SessionSubSection.Signup ? 'bg-[#fbbf24] text-[#1c1917]' : 'bg-[#2a221d] text-[#fbbf24]'}`}>Inscription</button>
              <button onClick={() => setSessionSubSection(SessionSubSection.Feedback)} className={`px-6 py-3 rounded-xl font-black uppercase text-[10px] transition-all ${sessionSubSection === SessionSubSection.Feedback ? 'bg-[#fbbf24] text-[#1c1917]' : 'bg-[#2a221d] text-[#fbbf24]'}`}>Donner mon avis</button>
            </div>
            <div className="parchment-card rounded-[3rem] overflow-hidden border-4 border-[#8a4b2d]/30 h-[800px] bg-white">
              <iframe src={sessionSubSection === SessionSubSection.Signup ? FORM_INSCRIPTION_URL : FORM_AVIS_URL} className="w-full h-full border-none" title="Session Feedback" />
            </div>
          </div>
        )}

        {/* MJ ANTRE SECTION */}
        {activeSection === NavSection.MJ && (
           <div className="max-w-7xl mx-auto px-4 py-16 space-y-16 animate-in fade-in">
             <div className="text-center space-y-6">
               <h2 className="text-4xl font-fantasy font-bold text-[#fbbf24] uppercase">Antre du Maître</h2>
               <div className="flex justify-center gap-4 flex-wrap items-center">
                  <button onClick={() => setMjSubSection(MJSonSection.Generator)} className={`px-8 py-3 rounded-xl font-black uppercase text-[10px] border border-transparent transition-all ${mjSubSection === MJSonSection.Generator ? 'bg-[#fbbf24] text-[#1c1917]' : 'bg-[#2a221d] text-[#fbbf24]'}`}>Générateurs IA</button>
                  <button onClick={() => setMjSubSection(MJSonSection.Planning)} className={`px-8 py-3 rounded-xl font-black uppercase text-[10px] border border-transparent transition-all ${mjSubSection === MJSonSection.Planning ? 'bg-[#fbbf24] text-[#1c1917]' : 'bg-[#2a221d] text-[#fbbf24]'}`}>Proposer une session de JDR</button>
                  <button onClick={() => { setMjSubSection(MJSonSection.Maps); setMjIframeUrl(ADVENTURE_LOCATIONS_URL); }} className={`px-8 py-3 rounded-xl font-black uppercase text-[10px] border border-transparent transition-all ${mjSubSection === MJSonSection.Maps ? 'bg-[#fbbf24] text-[#1c1917]' : 'bg-[#2a221d] text-[#fbbf24]'}`}>Cartographie</button>
                  <button onClick={() => { setMjSubSection(MJSonSection.Eye); setMjIframeUrl(EYE_OF_DARKNESS_URL); }} className={`px-8 py-3 rounded-xl font-black uppercase text-[10px] border border-transparent transition-all ${mjSubSection === MJSonSection.Eye ? 'bg-[#fbbf24] text-[#1c1917]' : 'bg-[#2a221d] text-[#fbbf24]'}`}>L'Oeil</button>
                  <div className="relative group">
                    <button className="px-8 py-3 rounded-xl font-black uppercase text-[10px] bg-[#2a221d] text-[#fbbf24] border border-[#fbbf24]/30 flex items-center gap-2">Assistants <Icons.ArrowLeft className="-rotate-90 w-3 h-3" /></button>
                    <div className="absolute top-full left-0 pt-2 w-48 hidden group-hover:block z-50">
                       <div className="bg-[#2a221d] border-2 border-[#8a4b2d] rounded-xl py-2 shadow-2xl">
                          <button onClick={() => openAssistantPopup(ASSISTANT_OEIL_NOIR)} className="w-full px-4 py-2 text-left text-[9px] font-black uppercase hover:bg-[#fbbf24] hover:text-black">Oeil Noir</button>
                          <button onClick={() => openAssistantPopup(ASSISTANT_CHTULU)} className="w-full px-4 py-2 text-left text-[9px] font-black uppercase hover:bg-[#fbbf24] hover:text-black">Cthulhu</button>
                          <button onClick={() => openAssistantPopup(ASSISTANT_DND)} className="w-full px-4 py-2 text-left text-[9px] font-black uppercase hover:bg-[#fbbf24] hover:text-black">D&D</button>
                          <button onClick={() => openAssistantPopup(ASSISTANT_WALKING_DEAD)} className="w-full px-4 py-2 text-left text-[9px] font-black uppercase hover:bg-[#fbbf24] hover:text-black">Walking Dead</button>
                          <button onClick={() => openAssistantPopup(ASSISTANT_PENDRAGON)} className="w-full px-4 py-2 text-left text-[9px] font-black uppercase hover:bg-[#fbbf24] hover:text-black">Pendragon</button>
                       </div>
                    </div>
                  </div>
               </div>
             </div>
             
             {mjSubSection === MJSonSection.Planning ? (
                <div className="space-y-16">
                   <div className="parchment-card p-10 rounded-3xl border-2 border-[#fbbf24]/20 max-w-2xl mx-auto shadow-2xl">
                      <h3 className="text-2xl font-fantasy text-[#fbbf24] mb-8 uppercase text-center">Proposer une Session de JDR</h3>
                      <form onSubmit={handleCreateSession} className="space-y-6">
                         <div className="grid md:grid-cols-2 gap-4">
                            <div className="col-span-2">
                              <label className="text-[10px] font-bold text-[#fbbf24] uppercase block mb-1">Nom du Maître de Jeu</label>
                              <input value={upcomingSessionForm.gm} onChange={e => setUpcomingSessionForm({...upcomingSessionForm, gm: e.target.value})} className="w-full bg-[#1c1917] p-4 rounded-xl text-white outline-none border border-[#8a4b2d]/50 focus:border-[#fbbf24]" placeholder="Votre nom de MJ..." required />
                            </div>
                            <input value={upcomingSessionForm.title} onChange={e => setUpcomingSessionForm({...upcomingSessionForm, title: e.target.value})} className="bg-[#1c1917] p-4 rounded-xl text-white outline-none border border-[#8a4b2d]/50 focus:border-[#fbbf24]" placeholder="Titre de l'aventure..." required />
                            <input value={upcomingSessionForm.system} onChange={e => setUpcomingSessionForm({...upcomingSessionForm, system: e.target.value})} className="bg-[#1c1917] p-4 rounded-xl text-white outline-none border border-[#8a4b2d]/50 focus:border-[#fbbf24]" placeholder="Système de jeu..." required />
                            <input value={upcomingSessionForm.date} onChange={e => setUpcomingSessionForm({...upcomingSessionForm, date: e.target.value})} className="bg-[#1c1917] p-4 rounded-xl text-white outline-none border border-[#8a4b2d]/50 focus:border-[#fbbf24]" placeholder="Date et Heure..." required />
                            <input value={upcomingSessionForm.discordLink} onChange={e => setUpcomingSessionForm({...upcomingSessionForm, discordLink: e.target.value})} className="bg-[#1c1917] p-4 rounded-xl text-white outline-none border border-[#8a4b2d]/50 focus:border-[#fbbf24]" placeholder="Lien d'invitation Discord..." required />
                         </div>
                         <textarea value={upcomingSessionForm.description} onChange={e => setUpcomingSessionForm({...upcomingSessionForm, description: e.target.value})} className="w-full bg-[#1c1917] p-4 rounded-xl text-white h-32 outline-none border border-[#8a4b2d]/50 focus:border-[#fbbf24]" placeholder="Description de l'aventure..." required />
                         <div className="flex items-center gap-4">
                            <div className="flex-grow">
                               <label className="text-[10px] font-bold text-[#fbbf24] uppercase block mb-1">Illustration (Vignette)</label>
                               <input type="file" accept="image/*" onChange={e => handleFileUpload(e, url => setUpcomingSessionForm({...upcomingSessionForm, banner: url}))} className="w-full bg-[#1c1917] p-3 rounded-xl text-white text-xs border border-[#8a4b2d]/30" />
                            </div>
                            {upcomingSessionForm.banner && <img src={upcomingSessionForm.banner} className="w-16 h-16 rounded-lg object-cover border border-[#fbbf24]/30" alt="Banner Preview" />}
                         </div>
                         <button type="submit" className="w-full bg-[#fbbf24] text-[#1c1917] py-4 rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl">Ouvrir la Table au Public</button>
                      </form>
                   </div>

                   <div className="space-y-8 max-w-4xl mx-auto">
                      <div className="text-center">
                        <h3 className="text-2xl font-fantasy text-[#fbbf24] uppercase">Vos Tables en cours</h3>
                        <p className="text-[#d4b08c]/50 text-xs italic mt-2">Gérez les sessions visibles sur la page d'accueil</p>
                      </div>
                      
                      {upcomingSessions.length > 0 ? (
                        <div className="grid md:grid-cols-2 gap-4">
                          {upcomingSessions.map((session) => (
                            <div key={session.id} className="parchment-card p-6 rounded-2xl border border-[#fbbf24]/10 flex items-center justify-between group hover:border-[#fbbf24]/40 transition-all">
                               <div className="flex items-center gap-4 overflow-hidden">
                                  <div className="w-12 h-12 rounded-lg bg-[#1c1917] border border-[#fbbf24]/20 flex-shrink-0 overflow-hidden">
                                     <img src={session.banner || branding.heroBg} className="w-full h-full object-cover opacity-60" alt="" />
                                  </div>
                                  <div className="overflow-hidden">
                                     <h4 className="font-fantasy text-[#fbbf24] text-sm truncate">{session.title}</h4>
                                     <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9px] font-black uppercase text-[#d4b08c]">{session.system}</span>
                                        <span className="text-[9px] text-[#d4b08c]/40">•</span>
                                        <span className="text-[9px] font-black uppercase text-[#fbbf24]/60">MJ: {session.gm}</span>
                                     </div>
                                  </div>
                               </div>
                               <button 
                                 onClick={() => handleDeleteSession(session.id)}
                                 className="ml-4 p-3 bg-red-900/10 text-red-400/50 hover:text-red-400 hover:bg-red-900/20 rounded-xl transition-all"
                                 title="Supprimer la session"
                               >
                                 <Icons.Dice className="w-5 h-5 rotate-45" />
                               </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center parchment-card rounded-3xl border-dashed border-2 border-[#8a4b2d]/30 text-[#d4b08c]/30">
                           <p className="italic uppercase font-black text-[10px]">Aucune session active n'est enregistrée pour le moment.</p>
                        </div>
                      )}
                   </div>
                </div>
             ) : mjSubSection === MJSonSection.Generator ? (
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="parchment-card p-8 rounded-3xl border border-[#fbbf24]/10 space-y-6 shadow-xl">
                    <h3 className="text-2xl font-fantasy text-[#fbbf24] text-center uppercase">Aventure Oracle</h3>
                    <button onClick={handleGenerateIdea} disabled={loadingIdea} className="w-full bg-[#fbbf24] text-[#1c1917] py-4 rounded-xl font-black uppercase shadow-lg hover:scale-105 transition-all">{loadingIdea ? 'Inspiration...' : 'Générer une Quête'}</button>
                    {idea && <div className="p-6 bg-black/40 rounded-xl space-y-2 border border-[#fbbf24]/10"><p className="font-fantasy text-lg text-[#fbbf24]">{idea.title}</p><p className="text-sm text-[#d4b08c]">{idea.hook}</p></div>}
                  </div>
                  <div className="parchment-card p-8 rounded-3xl border border-[#fbbf24]/10 space-y-6 shadow-xl">
                    <h3 className="text-2xl font-fantasy text-[#fbbf24] text-center uppercase">PNJ Mystérieux</h3>
                    <button onClick={handleGenerateNPC} disabled={loadingNpc} className="w-full bg-[#fbbf24] text-[#1c1917] py-4 rounded-xl font-black uppercase shadow-lg hover:scale-105 transition-all">{loadingNpc ? 'Invocation...' : 'Générer un Habitant'}</button>
                    {npc && <div className="p-6 bg-black/40 rounded-xl space-y-2 border border-[#fbbf24]/10"><p className="font-fantasy text-lg text-[#fbbf24]">{npc.name}</p><p className="text-sm italic text-[#d4b08c]">"{npc.personality}"</p></div>}
                  </div>
                </div>
             ) : (
                <div className="parchment-card rounded-[3rem] overflow-hidden border-4 border-[#8a4b2d]/30 h-[80vh] bg-white shadow-2xl"><iframe src={mjIframeUrl} className="w-full h-full border-none" title="Contenu MJ" /></div>
             )}
           </div>
        )}

        {/* ADMIN SECTION COMPLETE */}
        {activeSection === NavSection.Admin && (
          <div className="max-w-7xl mx-auto px-4 py-16 animate-in fade-in space-y-12">
             <div className="text-center space-y-6">
               <h2 className="text-4xl font-fantasy text-[#fbbf24] uppercase tracking-widest">Intendance</h2>
               <div className="flex justify-center gap-2 flex-wrap">
                  <button onClick={() => setAdminSubSection(AdminSubSection.Results)} className={`px-4 py-2 rounded-lg font-bold text-[9px] uppercase transition-all ${adminSubSection === AdminSubSection.Results ? 'bg-[#8a4b2d] text-white shadow-lg' : 'bg-[#8a4b2d]/10 text-[#fbbf24]'}`}>Registres</button>
                  <button onClick={() => setAdminSubSection(AdminSubSection.GalleryManager)} className={`px-4 py-2 rounded-lg font-bold text-[9px] uppercase transition-all ${adminSubSection === AdminSubSection.GalleryManager ? 'bg-[#8a4b2d] text-white shadow-lg' : 'bg-[#8a4b2d]/10 text-[#fbbf24]'}`}>Galerie</button>
                  <button onClick={() => setAdminSubSection(AdminSubSection.ShopManager)} className={`px-4 py-2 rounded-lg font-bold text-[9px] uppercase transition-all ${adminSubSection === AdminSubSection.ShopManager ? 'bg-[#8a4b2d] text-white shadow-lg' : 'bg-[#8a4b2d]/10 text-[#fbbf24]'}`}>Boutique</button>
                  <button onClick={() => setAdminSubSection(AdminSubSection.ProjectManager)} className={`px-4 py-2 rounded-lg font-bold text-[9px] uppercase transition-all ${adminSubSection === AdminSubSection.ProjectManager ? 'bg-[#8a4b2d] text-white shadow-lg' : 'bg-[#8a4b2d]/10 text-[#fbbf24]'}`}>Projets</button>
                  <button onClick={() => setAdminSubSection(AdminSubSection.PartnerManager)} className={`px-4 py-2 rounded-lg font-bold text-[9px] uppercase transition-all ${adminSubSection === AdminSubSection.PartnerManager ? 'bg-[#8a4b2d] text-white shadow-lg' : 'bg-[#8a4b2d]/10 text-[#fbbf24]'}`}>Alliés</button>
                  <button onClick={() => setAdminSubSection(AdminSubSection.Settings)} className={`px-4 py-2 rounded-lg font-bold text-[9px] uppercase transition-all ${adminSubSection === AdminSubSection.Settings ? 'bg-[#8a4b2d] text-white shadow-lg' : 'bg-[#8a4b2d]/10 text-[#fbbf24]'}`}>Grimoire</button>
               </div>
             </div>

             {/* REGISTRES */}
             {adminSubSection === AdminSubSection.Results && (
                <div className="parchment-card p-4 rounded-3xl border-2 border-[#8a4b2d]/40 shadow-2xl bg-white h-[70vh] overflow-hidden">
                   <iframe src={FORMS_APP_RESULTS_URL} className="w-full h-full border-none" title="Formulaires" />
                </div>
             )}

             {/* GALERIE MANAGER */}
             {adminSubSection === AdminSubSection.GalleryManager && (
                <div className="space-y-12">
                   <div className="parchment-card p-10 rounded-3xl border border-[#fbbf24]/10 max-w-xl mx-auto shadow-xl">
                      <h3 className="font-fantasy text-[#fbbf24] mb-8 text-center text-xl uppercase">Ajouter au Miroir</h3>
                      <form onSubmit={(e) => { 
                         e.preventDefault(); 
                         setGalleryImages([{...galleryForm, id: `img-${Date.now()}`}, ...galleryImages]); 
                         setGalleryForm({title:'', url:''});
                      }} className="space-y-6">
                         <input placeholder="Titre de l'image..." value={galleryForm.title} onChange={e => setGalleryForm({...galleryForm, title: e.target.value})} className="w-full bg-[#1c1917] p-4 rounded-xl text-white outline-none border border-[#8a4b2d]/30" required />
                         <div className="flex items-center gap-4">
                            <div className="flex-grow">
                               <label className="text-[10px] font-bold text-[#fbbf24] uppercase block mb-1">Fichier Image</label>
                               <input type="file" accept="image/*" onChange={e => handleFileUpload(e, url => setGalleryForm({...galleryForm, url: url}))} className="w-full bg-[#1c1917] p-3 rounded-xl text-white text-xs" required={!galleryForm.url} />
                            </div>
                            {galleryForm.url && <img src={galleryForm.url} className="w-16 h-16 rounded-lg object-cover border border-[#fbbf24]/30" alt="Preview" />}
                         </div>
                         <button type="submit" className="w-full bg-[#8a4b2d] text-white py-4 rounded-xl font-black uppercase">Exposer</button>
                      </form>
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      {galleryImages.map(img => (
                        <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
                           <img src={img.url} className="w-full h-full object-cover" alt={img.title} />
                           <button onClick={() => setGalleryImages(galleryImages.filter(i => i.id !== img.id))} className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                        </div>
                      ))}
                   </div>
                </div>
             )}

             {/* BOUTIQUE MANAGER */}
             {adminSubSection === AdminSubSection.ShopManager && (
                <div className="space-y-12">
                   <div className="parchment-card p-10 rounded-3xl border border-[#fbbf24]/10 max-w-xl mx-auto shadow-xl">
                      <h3 className="font-fantasy text-[#fbbf24] mb-8 text-center text-xl uppercase">Forger un Trésor</h3>
                      <form onSubmit={(e) => { 
                         e.preventDefault(); 
                         setShopItems([{...shopForm, id: `s-${Date.now()}`}, ...shopItems]); 
                         setShopForm({name:'', price:'', description:'', image:'', link:''});
                      }} className="space-y-6">
                         <div className="grid grid-cols-2 gap-4">
                            <input placeholder="Nom de l'objet..." value={shopForm.name} onChange={e => setShopForm({...shopForm, name: e.target.value})} className="bg-[#1c1917] p-4 rounded-xl text-white outline-none border border-[#8a4b2d]/30" required />
                            <input placeholder="Prix (ex: 15€)..." value={shopForm.price} onChange={e => setShopForm({...shopForm, price: e.target.value})} className="bg-[#1c1917] p-4 rounded-xl text-white outline-none border border-[#8a4b2d]/30" />
                         </div>
                         <textarea placeholder="Petite description de l'objet..." value={shopForm.description} onChange={e => setShopForm({...shopForm, description: e.target.value})} className="w-full bg-[#1c1917] p-4 rounded-xl text-white h-24 outline-none border border-[#8a4b2d]/30" />
                         <input placeholder="Lien HelloAsso (URL)..." value={shopForm.link} onChange={e => setShopForm({...shopForm, link: e.target.value})} className="w-full bg-[#1c1917] p-4 rounded-xl text-white outline-none border border-[#8a4b2d]/30" required />
                         <div className="flex items-center gap-4">
                            <div className="flex-grow">
                               <label className="text-[10px] font-bold text-[#fbbf24] uppercase block mb-1">Image Produit</label>
                               <input type="file" onChange={e => handleFileUpload(e, url => setShopForm({...shopForm, image: url}))} className="w-full bg-[#1c1917] p-3 rounded-xl text-white text-xs" required={!shopForm.image} />
                            </div>
                            {shopForm.image && <img src={shopForm.image} className="w-16 h-16 rounded-lg object-cover border border-[#fbbf24]/30" alt="Shop Item Preview" />}
                         </div>
                         <button type="submit" className="w-full bg-[#8a4b2d] text-white py-4 rounded-xl font-black uppercase">Mettre en vente</button>
                      </form>
                   </div>
                   <div className="grid md:grid-cols-4 gap-6">
                      {shopItems.map(s => (
                        <div key={s.id} className="parchment-card p-4 rounded-2xl flex flex-col items-center gap-4 border border-white/10 group">
                           <img src={s.image} className="h-32 w-full object-cover rounded-xl" alt={s.name} />
                           <div className="text-center">
                              <span className="block font-fantasy text-xs text-[#fbbf24]">{s.name}</span>
                              <span className="block text-[9px] text-[#d4b08c]/40 mt-1 line-clamp-1">{s.description || 'Pas de description'}</span>
                           </div>
                           <button onClick={() => setShopItems(shopItems.filter(i => i.id !== s.id))} className="text-red-400 uppercase font-black text-[9px] hover:text-red-600 transition-colors">Détruire l'objet</button>
                        </div>
                      ))}
                   </div>
                </div>
             )}

             {/* PARTNER MANAGER */}
             {adminSubSection === AdminSubSection.PartnerManager && (
                <div className="space-y-12">
                   <div className="parchment-card p-10 rounded-3xl border border-[#fbbf24]/10 max-w-xl mx-auto shadow-xl">
                      <h3 className="font-fantasy text-[#fbbf24] mb-8 text-center text-xl uppercase">Nouvel Allié</h3>
                      <form onSubmit={(e) => { 
                         e.preventDefault(); 
                         setPartners([{...partnerForm, id: `part-${Date.now()}`}, ...partners]); 
                         setPartnerForm({name:'', description:'', link:''});
                      }} className="space-y-6">
                         <input placeholder="Nom de l'allié..." value={partnerForm.name} onChange={e => setPartnerForm({...partnerForm, name: e.target.value})} className="w-full bg-[#1c1917] p-4 rounded-xl text-white outline-none border border-[#8a4b2d]/30" required />
                         <textarea placeholder="Description courte..." value={partnerForm.description} onChange={e => setPartnerForm({...partnerForm, description: e.target.value})} className="w-full bg-[#1c1917] p-4 rounded-xl text-white h-24 outline-none border border-[#8a4b2d]/30" />
                         <input placeholder="Lien Site Web (URL)..." value={partnerForm.link} onChange={e => setPartnerForm({...partnerForm, link: e.target.value})} className="w-full bg-[#1c1917] p-4 rounded-xl text-white outline-none border border-[#8a4b2d]/30" />
                         <button type="submit" className="w-full bg-[#8a4b2d] text-white py-4 rounded-xl font-black uppercase">Sceller l'alliance</button>
                      </form>
                   </div>
                   <div className="grid md:grid-cols-3 gap-6">
                      {partners.map(p => (
                        <div key={p.id} className="parchment-card p-6 rounded-2xl flex justify-between items-center group">
                           <div className="flex flex-col"><span className="font-fantasy text-[#fbbf24]">{p.name}</span><span className="text-[10px] text-[#d4b08c]/50 truncate max-w-[200px]">{p.link || 'Sans lien'}</span></div>
                           <button onClick={() => setPartners(partners.filter(i => i.id !== p.id))} className="text-red-400 hover:scale-125 transition-all">✕</button>
                        </div>
                      ))}
                   </div>
                </div>
             )}

             {/* PROJET MANAGER */}
             {adminSubSection === AdminSubSection.ProjectManager && (
                <div className="space-y-12">
                   <div className="parchment-card p-10 rounded-3xl border border-[#fbbf24]/10 max-w-xl mx-auto shadow-xl">
                      <h3 className="font-fantasy text-[#fbbf24] mb-8 text-center text-xl uppercase">Chronique d'un Projet</h3>
                      <form onSubmit={(e) => { 
                         e.preventDefault(); 
                         setProjects([{...projectForm, id: `p-${Date.now()}`}, ...projects]); 
                         setProjectForm({title:'', description:'', link: ''}); 
                      }} className="space-y-6">
                         <input placeholder="Titre du projet..." value={projectForm.title} onChange={e => setProjectForm({...projectForm, title: e.target.value})} className="w-full bg-[#1c1917] p-4 rounded-xl text-white outline-none border border-[#8a4b2d]/30" required />
                         <textarea placeholder="Description du projet..." value={projectForm.description} onChange={e => setProjectForm({...projectForm, description: e.target.value})} className="w-full bg-[#1c1917] p-4 rounded-xl text-white h-32 outline-none border border-[#8a4b2d]/30" required />
                         <input placeholder="Lien HelloAsso optionnel (URL)..." value={projectForm.link} onChange={e => setProjectForm({...projectForm, link: e.target.value})} className="w-full bg-[#1c1917] p-4 rounded-xl text-white outline-none border border-[#8a4b2d]/30" />
                         <button type="submit" className="w-full bg-[#8a4b2d] text-white py-4 rounded-xl font-black uppercase">Graver le projet</button>
                      </form>
                   </div>
                   <div className="grid md:grid-cols-3 gap-6">
                      {projects.map(p => (
                        <div key={p.id} className="parchment-card p-6 rounded-2xl flex justify-between items-center group">
                           <div className="flex flex-col">
                              <span className="font-fantasy text-[#fbbf24] text-sm">{p.title}</span>
                              {p.link && <span className="text-[9px] text-[#fbbf24]/40 mt-1 italic">Lien actif</span>}
                           </div>
                           <button onClick={() => setProjects(projects.filter(i => i.id !== p.id))} className="text-red-400 hover:scale-125 transition-all">✕</button>
                        </div>
                      ))}
                   </div>
                </div>
             )}

             {/* SETTINGS / BRANDING */}
             {adminSubSection === AdminSubSection.Settings && (
               <div className="parchment-card p-12 rounded-[3rem] border border-[#fbbf24]/10 max-w-xl mx-auto space-y-10 shadow-2xl">
                 <h3 className="text-2xl font-fantasy text-[#fbbf24] text-center uppercase">Grimoire Mondial</h3>
                 <div className="space-y-8">
                    <div>
                       <label className="text-[10px] font-black text-[#fbbf24] uppercase block mb-3 tracking-widest">Sceau Logo (Cercle)</label>
                       <div className="flex items-center gap-6">
                          <input type="file" onChange={e => handleFileUpload(e, url => setBranding({...branding, logo: url}))} className="flex-grow bg-[#1c1917] p-3 rounded-xl text-white text-xs border border-white/10" />
                          <img src={branding.logo} className="w-20 h-20 rounded-full border-4 border-[#fbbf24]/30 shadow-2xl object-cover" alt="Logo Branding" />
                       </div>
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-[#fbbf24] uppercase block mb-3 tracking-widest">Atmosphère (Fond Héros)</label>
                       <div className="flex items-center gap-6">
                          <input type="file" onChange={e => handleFileUpload(e, url => setBranding({...branding, heroBg: url}))} className="flex-grow bg-[#1c1917] p-3 rounded-xl text-white text-xs border border-white/10" />
                          <img src={branding.heroBg} className="w-20 h-12 rounded-xl border-2 border-[#fbbf24]/30 shadow-2xl object-cover" alt="Hero Background Branding" />
                       </div>
                    </div>
                 </div>
                 <button onClick={() => alert("Grimoire scellé. Les chroniques sont à jour.")} className="w-full bg-[#fbbf24] text-[#1c1917] py-5 rounded-2xl font-black uppercase shadow-xl hover:scale-105 transition-all">Sauvegarder les Changements</button>
               </div>
             )}
          </div>
        )}
      </main>

      <footer className="bg-[#12100e] py-16 border-t-2 border-[#8a4b2d]/20 text-center space-y-6">
         <img src={branding.logo} className="w-16 h-16 rounded-full border-2 border-[#fbbf24]/20 mx-auto object-cover" alt="Footer Logo" />
         <p className="text-[#d4b08c]/40 text-[9px] uppercase tracking-widest font-black">Association La Caverne de Baldius • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default App;
