import React, { useState, useEffect, useMemo } from 'react';
import { ExternalLink, User, Tag, Clock, Plus, ShieldCheck, ThumbsUp, Hash, Award, Hexagon, Calendar, MessageSquare, Edit2, Trash2, AlertTriangle, X, Globe, LogIn, LogOut } from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";

// --- Firebase Initialization ---
const providedConfig = {
  apiKey: "AIzaSyAOdxCPy0DlkG3os0o7gzFbB8exYW7Givg",
  authDomain: "asagiri-cf919.firebaseapp.com",
  projectId: "asagiri-cf919",
  storageBucket: "asagiri-cf919.firebasestorage.app",
  messagingSenderId: "891439441191",
  appId: "1:891439441191:web:8b37274777f2cdf9487502",
  measurementId: "G-7FP7P3Q1KD"
};
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : providedConfig;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const currentAppId = typeof __app_id !== 'undefined' ? __app_id : 'koreoreno-app-default';
const claimsCollectionPath = `artifacts/${currentAppId}/public/data/claims`;
const objectionsCollectionPath = `artifacts/${currentAppId}/public/data/objections`;

const generateTokenId = () => {
  return '0x' + Array.from({length: 16}, () => Math.floor(Math.random()*16).toString(16)).join('');
};

// --- 多言語化 (i18n) 設定 ---
const LANGUAGES = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'ko', label: '한국어' },
  { code: 'pt', label: 'Português' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'hi', label: 'हिन्दी' }
];

const CATEGORY_INTERNAL = ["すべて", "言葉・スラング", "アプリ・サービス", "アイデア・ハック", "デザイン・アート", "ゲーム", "同人誌", "その他"];
const catI18nMap = {
  "すべて": "catAll", "言葉・スラング": "catWords", "アプリ・サービス": "catApps", 
  "アイデア・ハック": "catIdeas", "デザイン・アート": "catDesign", "ゲーム": "catGames", "同人誌": "catDoujin", "その他": "catOthers"
};

const i18n = {
  ja: {
    title: "これ俺の！", subtitle: "〜 あなたのアイデアと作品を守ろう 〜",
    connecting: "Connecting...", user: "User:", mintTitle: "起源をMintする (登録)", authLoading: "認証情報を読み込み中です...",
    itemLabel: "案件 (名前・タイトル)", itemPlaceholder: "例: 「〇〇」という言葉", catLabel: "カテゴリ", dateLabel: "起源日", optional: "(任意)",
    authorLabel: "作者 (あなた)", authorPlaceholder: "例: 山田たろう", authorNote: "※一度入力すると次回から自動入力されます",
    urlLabel: "証跡 (URL)", urlPlaceholder: "XやNoteのURL", commentLabel: "一言コメント", commentPlaceholder: "生まれた背景やエピソードなど",
    submit: "「これ俺の！」と宣言する", submitting: "登録中...",
    catAll: "すべて", catWords: "言葉・スラング", catApps: "アプリ・サービス", catIdeas: "アイデア・ハック", catDesign: "デザイン・アート", catGames: "ゲーム", catDoujin: "同人誌", catOthers: "その他",
    noClaims: "このカテゴリにはまだ宣言がありません。", yourClaim: "あなたの宣言", viewProof: "証跡を見る", agree: "賛同", shareX: "𝕏 で宣言する", objection: "異議あり",
    delTitle: "本当に削除しますか？", delDesc: "一度削除した「これ俺の！」宣言は元に戻せません。", cancel: "キャンセル", delBtn: "削除する",
    objTitle: "異議を申し立てる", objDesc: "この宣言に対して「私の方が先だ」「事実と異なる」などのメッセージを送信します。運営が内容を確認し、必要に応じて対応・非表示にします。", objPlaceholder: "異議の理由や、あなたの証拠URLなどを記載してください", objSubmit: "異議を送信する",
    editTitle: "宣言を編集する", editBtn: "更新する",
    notifAdd: "「これ俺の！」を世界に宣言しました！", notifDel: "宣言を取り下げました。", notifEdit: "宣言内容を更新しました。", notifObj: "異議申し立てを送信しました。運営にて確認します。",
    tweetPrefix: "「", tweetSuffix: "」の起源は", tweetIsMe: "私", tweetEnd: "です！証拠はこちら👇", tweetHashtags: "\n#これ俺の #OriginProtocol\n",
    loginGoogle: "Googleでログイン", loginRequired: "宣言を行うにはログインが必要です", logout: "ログアウト",
    guestUser: "ゲスト（閲覧のみ）", googleUser: "Googleログイン済み"
  },
  en: {
    title: "This is MINE!", subtitle: "~ Protect your ideas and works ~",
    connecting: "Connecting...", user: "User:", mintTitle: "Mint your origin", authLoading: "Loading auth...",
    itemLabel: "Item (Name/Title)", itemPlaceholder: "e.g., The word 'XXX'", catLabel: "Category", dateLabel: "Origin Date", optional: "(Optional)",
    authorLabel: "Author (You)", authorPlaceholder: "e.g., John Doe", authorNote: "* Will be auto-filled next time",
    urlLabel: "Proof (URL)", urlPlaceholder: "URL of X, Note, etc.", commentLabel: "Comment", commentPlaceholder: "Background or episode",
    submit: "Declare 'This is MINE!'", submitting: "Minting...",
    catAll: "All", catWords: "Words/Slang", catApps: "Apps/Services", catIdeas: "Ideas/Hacks", catDesign: "Design/Art", catGames: "Games", catDoujin: "Doujinshi/Zines", catOthers: "Others",
    noClaims: "No claims in this category yet.", yourClaim: "Your Claim", viewProof: "View Proof", agree: "Agree", shareX: "Declare on 𝕏", objection: "Objection",
    delTitle: "Delete claim?", delDesc: "Deleted claims cannot be restored.", cancel: "Cancel", delBtn: "Delete",
    objTitle: "File an Objection", objDesc: "Send a message to admins claiming priority or inaccuracy.", objPlaceholder: "Reason, your proof URL, etc.", objSubmit: "Submit Objection",
    editTitle: "Edit Claim", editBtn: "Update",
    notifAdd: "Declared to the world!", notifDel: "Claim deleted.", notifEdit: "Claim updated.", notifObj: "Objection sent for review.",
    tweetPrefix: "The origin of '", tweetSuffix: "' is ", tweetIsMe: "ME", tweetEnd: "! Proof here👇", tweetHashtags: "\n#ThisIsMine #OriginProtocol\n",
    loginGoogle: "Sign in with Google", loginRequired: "Login required to mint", logout: "Logout",
    guestUser: "Guest (View Only)", googleUser: "Logged in via Google"
  },
  zh: {
    title: "这是我的！", subtitle: "~ 保护你的创意和作品 ~",
    connecting: "连接中...", user: "用户:", mintTitle: "铸造你的起源 (注册)", authLoading: "加载认证信息中...",
    itemLabel: "项目 (名称/标题)", itemPlaceholder: "例：词语“XXX”", catLabel: "类别", dateLabel: "起源日期", optional: "(可选)",
    authorLabel: "作者 (你)", authorPlaceholder: "例：张三", authorNote: "* 下次将自动填写",
    urlLabel: "证据 (URL)", urlPlaceholder: "X或Note的URL", commentLabel: "评论", commentPlaceholder: "背景或故事",
    submit: "宣布“这是我的！”", submitting: "注册中...",
    catAll: "全部", catWords: "词语/俚语", catApps: "应用/服务", catIdeas: "创意/技巧", catDesign: "设计/艺术", catGames: "游戏", catDoujin: "同人志", catOthers: "其他",
    noClaims: "该类别尚无声明。", yourClaim: "你的声明", viewProof: "查看证据", agree: "赞同", shareX: "在𝕏上宣布", objection: "提出异议",
    delTitle: "确认删除？", delDesc: "删除后无法恢复。", cancel: "取消", delBtn: "删除",
    objTitle: "提出异议", objDesc: "发送信息说明“我才是首创”或“与事实不符”。", objPlaceholder: "异议理由及你的证据URL等", objSubmit: "提交异议",
    editTitle: "编辑声明", editBtn: "更新",
    notifAdd: "已向世界宣布！", notifDel: "声明已删除。", notifEdit: "声明已更新。", notifObj: "异议已提交审核。",
    tweetPrefix: "“", tweetSuffix: "”的起源是", tweetIsMe: "我", tweetEnd: "！证据在此👇", tweetHashtags: "\n#这是我的 #OriginProtocol\n",
    loginGoogle: "使用Google登录", loginRequired: "铸造需要登录", logout: "登出",
    guestUser: "访客 (仅限浏览)", googleUser: "已登录Google"
  },
  ko: {
    title: "이거 내거야!", subtitle: "~ 당신의 아이디어와 작품을 지키세요 ~",
    connecting: "연결 중...", user: "사용자:", mintTitle: "기원 민팅하기 (등록)", authLoading: "인증 정보 불러오는 중...",
    itemLabel: "항목 (이름/제목)", itemPlaceholder: "예: 'ㅇㅇㅇ'라는 단어", catLabel: "카테고리", dateLabel: "기원일", optional: "(선택)",
    authorLabel: "작성자 (본인)", authorPlaceholder: "예: 홍길동", authorNote: "* 다음부터 자동 입력됩니다",
    urlLabel: "증거 (URL)", urlPlaceholder: "X 또는 Note URL", commentLabel: "코멘트", commentPlaceholder: "배경이나 에피소드 등",
    submit: "'이거 내거야!' 선언하기", submitting: "등록 중...",
    catAll: "전체", catWords: "단어/슬랭", catApps: "앱/서비스", catIdeas: "아이디어/핵", catDesign: "디자인/아트", catGames: "게임", catDoujin: "동인지", catOthers: "기타",
    noClaims: "이 카테고리에는 아직 선언이 없습니다.", yourClaim: "당신의 선언", viewProof: "증거 보기", agree: "동의", shareX: "𝕏에 선언하기", objection: "이의 제기",
    delTitle: "정말 삭제하시겠습니까?", delDesc: "삭제된 선언은 복구할 수 없습니다.", cancel: "취소", delBtn: "삭제",
    objTitle: "이의 제기하기", objDesc: "'내가 먼저다' 혹은 '사실과 다르다' 등의 메시지를 보냅니다.", objPlaceholder: "이의 제기 이유 및 증거 URL 등", objSubmit: "이의 제기 보내기",
    editTitle: "선언 수정하기", editBtn: "업데이트",
    notifAdd: "세계에 선언했습니다!", notifDel: "선언을 삭제했습니다.", notifEdit: "선언 내용을 업데이트했습니다.", notifObj: "이의 제기를 보냈습니다.",
    tweetPrefix: "'", tweetSuffix: "'의 기원은 ", tweetIsMe: "저", tweetEnd: "입니다! 증거는 여기👇", tweetHashtags: "\n#이거내거야 #OriginProtocol\n",
    loginGoogle: "Google로 로그인", loginRequired: "등록하려면 로그인이 필요합니다", logout: "로그아웃",
    guestUser: "게스트 (읽기 전용)", googleUser: "Google 로그인됨"
  },
  pt: {
    title: "Isso é MEU!", subtitle: "~ Proteja suas ideias e criações ~",
    connecting: "Conectando...", user: "Usuário:", mintTitle: "Mintar origem", authLoading: "Carregando...",
    itemLabel: "Item (Nome/Título)", itemPlaceholder: "ex: A palavra 'XXX'", catLabel: "Categoria", dateLabel: "Data de Origem", optional: "(Opcional)",
    authorLabel: "Autor (Você)", authorPlaceholder: "ex: João", authorNote: "* Preenchimento automático na próxima vez",
    urlLabel: "Prova (URL)", urlPlaceholder: "URL do X, Note, etc.", commentLabel: "Comentário", commentPlaceholder: "Fundo ou episódio",
    submit: "Declarar 'Isso é MEU!'", submitting: "Mintando...",
    catAll: "Todos", catWords: "Palavras/Gírias", catApps: "Apps/Serviços", catIdeas: "Ideias/Hacks", catDesign: "Design/Arte", catGames: "Jogos", catDoujin: "Doujinshi/Fanzines", catOthers: "Outros",
    noClaims: "Nenhuma declaração nesta categoria.", yourClaim: "Sua Declaração", viewProof: "Ver Prova", agree: "Concordar", shareX: "Declarar no 𝕏", objection: "Objeção",
    delTitle: "Deletar?", delDesc: "Não pode ser desfeito.", cancel: "Cancelar", delBtn: "Deletar",
    objTitle: "Fazer Objeção", objDesc: "Envie uma mensagem dizendo que você foi o primeiro.", objPlaceholder: "Razão, URL de prova, etc.", objSubmit: "Enviar",
    editTitle: "Editar", editBtn: "Atualizar",
    notifAdd: "Declarado ao mundo!", notifDel: "Deletado.", notifEdit: "Atualizado.", notifObj: "Objeção enviada.",
    tweetPrefix: "A origem de '", tweetSuffix: "' é ", tweetIsMe: "MIM", tweetEnd: "! Prova aqui👇", tweetHashtags: "\n#IssoEMeu #OriginProtocol\n",
    loginGoogle: "Entrar com Google", loginRequired: "Login necessário para mintar", logout: "Sair",
    guestUser: "Visitante", googleUser: "Logado (Google)"
  },
  fr: {
    title: "C'est à MOI !", subtitle: "~ Protégez vos idées et créations ~",
    connecting: "Connexion...", user: "Utilisateur:", mintTitle: "Créer votre origine", authLoading: "Chargement...",
    itemLabel: "Élément (Nom/Titre)", itemPlaceholder: "ex: Le mot 'XXX'", catLabel: "Catégorie", dateLabel: "Date d'origine", optional: "(Optionnel)",
    authorLabel: "Auteur (Vous)", authorPlaceholder: "ex: Jean", authorNote: "* Sera rempli automatiquement",
    urlLabel: "Preuve (URL)", urlPlaceholder: "URL de X, Note, etc.", commentLabel: "Commentaire", commentPlaceholder: "Contexte ou épisode",
    submit: "Déclarer 'C'est à MOI !'", submitting: "En cours...",
    catAll: "Tout", catWords: "Mots/Argot", catApps: "Apps/Services", catIdeas: "Idées/Astuces", catDesign: "Design/Art", catGames: "Jeux", catDoujin: "Doujinshi/Fanzines", catOthers: "Autres",
    noClaims: "Aucune déclaration.", yourClaim: "Votre Déclaration", viewProof: "Voir Preuve", agree: "Approuver", shareX: "Déclarer sur 𝕏", objection: "Objection",
    delTitle: "Supprimer ?", delDesc: "Action irréversible.", cancel: "Annuler", delBtn: "Supprimer",
    objTitle: "Faire une Objection", objDesc: "Envoyez un message aux admins.", objPlaceholder: "Raison, URL de preuve...", objSubmit: "Envoyer",
    editTitle: "Éditer", editBtn: "Mettre à jour",
    notifAdd: "Déclaré au monde !", notifDel: "Supprimé.", notifEdit: "Mis à jour.", notifObj: "Objection envoyée.",
    tweetPrefix: "L'origine de '", tweetSuffix: "' est ", tweetIsMe: "MOI", tweetEnd: " ! Preuve ici👇", tweetHashtags: "\n#CestAmoi #OriginProtocol\n",
    loginGoogle: "Se connecter avec Google", loginRequired: "Connexion requise pour créer", logout: "Déconnexion",
    guestUser: "Invité (Lecture seule)", googleUser: "Connecté via Google"
  },
  de: {
    title: "Das ist MEINS!", subtitle: "~ Schütze deine Ideen und Werke ~",
    connecting: "Verbinde...", user: "Benutzer:", mintTitle: "Ursprung prägen", authLoading: "Lade...",
    itemLabel: "Element (Name/Titel)", itemPlaceholder: "z.B. Das Wort 'XXX'", catLabel: "Kategorie", dateLabel: "Ursprungsdatum", optional: "(Optional)",
    authorLabel: "Autor (Du)", authorPlaceholder: "z.B. Max Mustermann", authorNote: "* Wird beim nächsten Mal automatisch ausgefüllt",
    urlLabel: "Beweis (URL)", urlPlaceholder: "URL von X, Note, etc.", commentLabel: "Kommentar", commentPlaceholder: "Hintergrund oder Episode",
    submit: "Erkläre 'Das ist MEINS!'", submitting: "Präge...",
    catAll: "Alle", catWords: "Wörter/Slang", catApps: "Apps/Dienste", catIdeas: "Ideen/Hacks", catDesign: "Design/Kunst", catGames: "Spiele", catDoujin: "Doujinshi/Fanzines", catOthers: "Andere",
    noClaims: "Keine Erklärungen hier.", yourClaim: "Deine Erklärung", viewProof: "Beweis ansehen", agree: "Zustimmen", shareX: "Auf 𝕏 erklären", objection: "Einspruch",
    delTitle: "Löschen?", delDesc: "Kann nicht rückgängig gemacht werden.", cancel: "Abbrechen", delBtn: "Löschen",
    objTitle: "Einspruch erheben", objDesc: "Sende eine Nachricht an die Admins.", objPlaceholder: "Grund, Beweis-URL, etc.", objSubmit: "Senden",
    editTitle: "Bearbeiten", editBtn: "Aktualisieren",
    notifAdd: "Der Welt erklärt!", notifDel: "Gelöscht.", notifEdit: "Aktualisiert.", notifObj: "Einspruch gesendet.",
    tweetPrefix: "Der Ursprung von '", tweetSuffix: "' ist ", tweetIsMe: "MICH", tweetEnd: "! Beweis hier👇", tweetHashtags: "\n#DasIstMeins #OriginProtocol\n",
    loginGoogle: "Mit Google anmelden", loginRequired: "Anmeldung erforderlich", logout: "Abmelden",
    guestUser: "Gast (Nur ansehen)", googleUser: "Über Google angemeldet"
  },
  hi: {
    title: "यह मेरा है!", subtitle: "~ अपने विचारों और रचनाओं की रक्षा करें ~",
    connecting: "कनेक्ट हो रहा है...", user: "यूज़र:", mintTitle: "अपना मूल मिंट करें", authLoading: "लोड हो रहा है...",
    itemLabel: "आइटम (नाम/शीर्षक)", itemPlaceholder: "उदाहरण: 'XXX' शब्द", catLabel: "श्रेणी", dateLabel: "मूल तिथि", optional: "(वैकल्पिक)",
    authorLabel: "लेखक (आप)", authorPlaceholder: "उदाहरण: राहुल", authorNote: "* अगली बार अपने आप भर जाएगा",
    urlLabel: "प्रमाण (URL)", urlPlaceholder: "X, Note आदि का URL", commentLabel: "टिप्पणी", commentPlaceholder: "पृष्ठभूमि या प्रसंग",
    submit: "घोषित करें 'यह मेरा है!'", submitting: "पंजीकरण...",
    catAll: "सभी", catWords: "शब्द/कथा", catApps: "ऐप्स/सेवाएं", catIdeas: "विचार/हैक", catDesign: "डिजाइन/कला", catGames: "गेम्स", catDoujin: "डोजिनशी/फैनजीन", catOthers: "अन्य",
    noClaims: "इस श्रेणी में अभी तक कोई दावा नहीं है।", yourClaim: "आपका दावा", viewProof: "प्रमाण देखें", agree: "सहमत", shareX: "𝕏 पर घोषित करें", objection: "आपत्ति",
    delTitle: "क्या आप वाकई हटाना चाहते हैं?", delDesc: "इसे पूर्ववत नहीं किया जा सकता।", cancel: "रद्द करें", delBtn: "हटाएं",
    objTitle: "आपत्ति दर्ज करें", objDesc: "व्यवस्थापकों को संदेश भेजें।", objPlaceholder: "कारण, आपका प्रमाण URL आदि", objSubmit: "आपत्ति भेजें",
    editTitle: "संपादित करें", editBtn: "अद्यतन",
    notifAdd: "दुनिया को घोषित किया!", notifDel: "हटा दिया गया।", notifEdit: "अद्यतन किया गया।", notifObj: "आपत्ति भेजी गई।",
    tweetPrefix: "'", tweetSuffix: "' का मूल ", tweetIsMe: "मैं", tweetEnd: " हूँ! प्रमाण यहाँ👇", tweetHashtags: "\n#ThisIsMine #OriginProtocol\n",
    loginGoogle: "Google से साइन इन करें", loginRequired: "मिंट करने के लिए लॉगिन आवश्यक है", logout: "लॉग आउट",
    guestUser: "अतिथि (केवल देखें)", googleUser: "Google से लॉग इन"
  }
};

export default function App() {
  const [lang, setLang] = useState('ja');
  const t = i18n[lang] || i18n['ja'];

  const [user, setUser] = useState(null);
  const [claims, setClaims] = useState([]);
  const [activeCategory, setActiveCategory] = useState("すべて");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const savedAuthor = useMemo(() => localStorage.getItem('koreoreno_author') || '', []);

  const [formData, setFormData] = useState({
    title: '', category: '言葉・スラング', author: savedAuthor, proofUrl: '', originDate: '', comment: ''
  });

  const [editingClaim, setEditingClaim] = useState(null);
  const [infoModal, setInfoModal] = useState({ isOpen: false, type: null });
  const [deleteConfirm, setDeleteConfirm] = useState(null); 
  const [notification, setNotification] = useState(''); 

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        }
      } catch (error) {
        console.error("Auth Error:", error);
      }
    };
    initAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
      } else {
        try {
          await signInAnonymously(auth);
        } catch(e) { console.error("Anon Auth Error:", e); }
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Login Error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  useEffect(() => {
    if (!user) return;
    const claimsRef = collection(db, claimsCollectionPath);
    const unsubscribeSnapshot = onSnapshot(claimsRef, (snapshot) => {
        const claimsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setClaims(claimsData);
      }, (error) => console.error("Fetch Error:", error));
    return () => unsubscribeSnapshot();
  }, [user]);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !formData.title || !formData.author || !formData.proofUrl) return;
    setIsSubmitting(true);
    try {
      localStorage.setItem('koreoreno_author', formData.author);
      const todayStr = new Date().toISOString().split('T')[0];
      const newClaim = {
        title: formData.title, category: formData.category, author: formData.author,
        proofUrl: formData.proofUrl, originDate: formData.originDate || todayStr, 
        comment: formData.comment, timestamp: Date.now(), likes: 0, tokenId: generateTokenId(),
        userId: user.uid, status: 'active'
      };
      await addDoc(collection(db, claimsCollectionPath), newClaim);
      setFormData({
        title: '', category: '言葉・スラング', author: formData.author, proofUrl: '', originDate: '', comment: ''
      });
      showNotification(t.notifAdd);
    } catch (error) {
      console.error("Submit Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (claimId, currentLikes) => {
    if (!user) return;
    try {
      const claimRef = doc(db, claimsCollectionPath, claimId);
      await updateDoc(claimRef, { likes: currentLikes + 1 });
    } catch (error) {
      console.error("Like Error:", error);
    }
  };

  const handleDelete = async () => {
    if (!user || !deleteConfirm) return;
    try {
      await deleteDoc(doc(db, claimsCollectionPath, deleteConfirm));
      setDeleteConfirm(null);
      showNotification(t.notifDel);
    } catch (error) {
      console.error("Delete Error:", error);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!user || !editingClaim) return;
    try {
      const claimRef = doc(db, claimsCollectionPath, editingClaim.id);
      await updateDoc(claimRef, {
        title: editingClaim.title, category: editingClaim.category,
        proofUrl: editingClaim.proofUrl, originDate: editingClaim.originDate, comment: editingClaim.comment
      });
      setEditingClaim(null);
      showNotification(t.notifEdit);
    } catch (error) {
      console.error("Edit Error:", error);
    }
  };

  const handleObjection = (claim) => {
    const baseUrl = "https://oyajibuki.github.io/form/";
    const subject = encodeURIComponent(`【これ俺の！】異議あり　${claim.title}について`);
    const body = encodeURIComponent(`なぜ異議を申したてるのか？（自分のほうが早い、他の人のほうが早い、その他）\n[ ]\n\n自分が公開している日程\n[ 年 月 日 ]\n\n証跡URL\n[ URLを記載 ]\n\n-----\n※対象の宣言ID: ${claim.tokenId}\n※対象の証跡URL: ${claim.proofUrl}`);
    window.open(`${baseUrl}?subject=${subject}&message=${body}`, '_blank');
  };

  const filteredAndSortedClaims = useMemo(() => {
    let result = claims.filter(c => c.status === 'active');
    if (activeCategory !== "すべて") {
      result = result.filter(c => c.category === activeCategory);
    }
    return result.sort((a, b) => b.timestamp - a.timestamp);
  }, [claims, activeCategory]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 pb-20">
      
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl font-bold flex items-center gap-2 animate-bounce whitespace-nowrap text-sm sm:text-base">
          <ShieldCheck className="w-5 h-5 text-green-400 shrink-0" />
          {notification}
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg border-b border-indigo-500/30 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg shadow-inner shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
              <h1 className="text-xl sm:text-2xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-purple-200">
                {t.title}
              </h1>
              <p className="text-[10px] sm:text-sm text-indigo-300 font-medium tracking-wide truncate max-w-[200px] sm:max-w-none">
                {t.subtitle}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* 言語切り替え */}
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg px-2 py-1.5 border border-slate-700 hover:border-slate-500 transition-colors">
              <Globe className="w-4 h-4 text-slate-300 shrink-0" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-200 outline-none cursor-pointer appearance-none pl-1 pr-4 relative"
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .1rem top 50%', backgroundSize: '.65rem auto' }}
              >
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code} className="bg-slate-800 text-white">{l.label}</option>
                ))}
              </select>
            </div>

            {user ? (
              <div className="hidden sm:flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0"></div>
                <span className="text-xs font-bold text-slate-300">{user.isAnonymous ? t.guestUser : t.googleUser}</span>
                {!user.isAnonymous && (
                  <button onClick={handleLogout} className="ml-1 p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors" title={t.logout}>
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <span className="text-sm text-slate-400 hidden sm:inline">{t.connecting}</span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-24">
            <h2 className="text-lg font-black mb-6 flex items-center gap-2 text-slate-800">
              <Hexagon className="w-5 h-5 text-indigo-600" />
              {t.mintTitle}
            </h2>
            
            {!user ? (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                {t.authLoading}
              </div>
            ) : user.isAnonymous ? (
              <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                  <ShieldCheck className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-base font-bold text-slate-700 mb-2">{t.loginRequired}</h3>
                <p className="text-xs text-slate-500 mb-6 font-medium">※宣言の証跡と作者を紐付けるため、Google認証が必要です。タイムラインの閲覧はそのまま可能です。</p>
                <button onClick={handleGoogleLogin} className="w-full relative group overflow-hidden bg-white text-slate-700 font-bold py-3 px-4 rounded-xl border border-slate-200 transition-all hover:shadow-md hover:border-indigo-300 flex items-center justify-center gap-2 text-sm">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  {t.loginGoogle}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{t.itemLabel} <span className="text-red-500">*</span></label>
                  <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder={t.itemPlaceholder} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm" required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">{t.catLabel}</label>
                    <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm">
                      {CATEGORY_INTERNAL.filter(c => c !== "すべて").map(cat => <option key={cat} value={cat}>{t[catI18nMap[cat]]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">{t.dateLabel} <span className="text-slate-400 font-normal text-xs">{t.optional}</span></label>
                    <input type="date" name="originDate" value={formData.originDate} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{t.authorLabel} <span className="text-red-500">*</span></label>
                  <input type="text" name="author" value={formData.author} onChange={handleInputChange} placeholder={t.authorPlaceholder} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm" required />
                  <p className="text-[10px] text-slate-400 mt-1">{t.authorNote}</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{t.urlLabel} <span className="text-red-500">*</span></label>
                  <input type="url" name="proofUrl" value={formData.proofUrl} onChange={handleInputChange} placeholder={t.urlPlaceholder} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm" required />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{t.commentLabel} <span className="text-slate-400 font-normal text-xs">{t.optional}</span></label>
                  <textarea name="comment" value={formData.comment} onChange={handleInputChange} placeholder={t.commentPlaceholder} rows="2" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm resize-none"></textarea>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full relative group overflow-hidden bg-slate-900 text-white font-bold py-3 px-4 rounded-xl transition-all hover:shadow-lg disabled:opacity-70 mt-2 text-sm">
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <span className="relative flex items-center justify-center gap-2">
                    {isSubmitting ? t.submitting : t.submit}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: List */}
        <div className="lg:col-span-8">
          
          {/* カテゴリフィルター */}
          <div className="mb-6">
            <div className="flex overflow-x-auto pb-2 hide-scrollbar gap-2">
              {CATEGORY_INTERNAL.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    activeCategory === category ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t[catI18nMap[category]]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {filteredAndSortedClaims.map((claim) => {
              const isMine = user && claim.userId === user.uid;
              const tweetText = encodeURIComponent(`${t.tweetPrefix}${claim.title}${t.tweetSuffix}${isMine ? t.tweetIsMe : claim.author}${t.tweetEnd}${t.tweetHashtags}\nhttps://its-me-indol.vercel.app/`);
              const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(claim.proofUrl)}`;

              return (
                <div key={claim.id} className={`group relative bg-white rounded-2xl shadow-sm border ${isMine ? 'border-indigo-300' : 'border-slate-200'} hover:shadow-xl transition-all duration-300 overflow-hidden`}>
                  {isMine && <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg z-10">{t.yourClaim}</div>}
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mb-2 break-all">{claim.title}</h3>
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-lg">
                          <Tag className="w-3.5 h-3.5 shrink-0" />{t[catI18nMap[claim.category]] || claim.category}
                        </span>
                      </div>
                    </div>
                    
                    {claim.comment && (
                      <div className="mb-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 flex gap-2 items-start break-words">
                        <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <p className="leading-relaxed">{claim.comment}</p>
                      </div>
                    )}
                    
                    <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Creator</p>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {claim.author.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-700 text-sm truncate">{claim.author}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Origin Date</p>
                          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                            <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                            {claim.originDate}
                          </div>
                        </div>
                        <div className="hidden md:block">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mint Date</p>
                          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            {new Date(claim.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
                          <Hash className="w-3 h-3 shrink-0" />ID: {claim.tokenId}
                        </div>
                        <a href={claim.proofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1.5 rounded-md self-start sm:self-auto">
                          {t.viewProof} <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleLike(claim.id, claim.likes || 0)} className="group/btn flex items-center gap-2 bg-white border border-slate-200 hover:border-pink-200 hover:bg-pink-50 px-4 py-2 rounded-full transition-all">
                          <ThumbsUp className="w-4 h-4 text-slate-400 group-hover/btn:text-pink-500 shrink-0" />
                          <span className="text-sm font-bold text-slate-600 group-hover/btn:text-pink-600">
                            {t.agree} {(claim.likes || 0) > 0 && <span className="ml-1 bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full text-xs">{claim.likes}</span>}
                          </span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2 ml-auto">
                        {isMine ? (
                          <>
                            <a href={tweetUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-black text-white px-4 py-1.5 rounded-full text-sm font-bold hover:bg-gray-800 transition-all mr-2">
                              {t.shareX}
                            </a>
                            <button onClick={() => setEditingClaim(claim)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors" title="Edit">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteConfirm(claim.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => handleObjection(claim)} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-orange-600 hover:bg-orange-50 px-3 py-1.5 rounded-full transition-colors border border-transparent hover:border-orange-200">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {t.objection}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredAndSortedClaims.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
                <Hexagon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium text-sm">{t.noClaims}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* --- Modals --- */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">{t.delTitle}</h3>
            <p className="text-sm text-slate-500 mb-6">{t.delDesc}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg">{t.cancel}</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg">{t.delBtn}</button>
            </div>
          </div>
        </div>
      )}

      {infoModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-xl font-black text-slate-900">
                {infoModal.type === 'privacy' ? 'プライバシーポリシー' : 'サポート・運営について'}
              </h3>
              <button onClick={() => setInfoModal({ isOpen: false, type: null })} className="text-slate-400 hover:text-slate-600 p-2"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="prose prose-slate prose-sm sm:prose-base max-w-none text-slate-600">
              {infoModal.type === 'privacy' ? (
                <>
                  <p>本サービス「これ俺の！」（以下、「本サービス」）は、ユーザーのプライバシー情報の取扱いについて、以下のとおりプライバシーポリシーを定めます。</p>
                  <h4 className="font-bold mt-4 mb-2 text-slate-800">1. 個人情報の収集方法</h4>
                  <p>本サービスは、Google認証等を利用する際に、必要な最小限の認証情報（ユーザーID等）を取得します。メールアドレスや氏名等の個人を特定する情報は、システム上保持・公開されません。</p>
                  <h4 className="font-bold mt-4 mb-2 text-slate-800">2. 個人情報の利用目的</h4>
                  <p>取得した情報は、投稿者の同一性確認（「本人のみが編集・削除できる」機能の提供）およびスパム行為の防止のためにのみ利用します。</p>
                  <h4 className="font-bold mt-4 mb-2 text-slate-800">3. 第三者提供と免責事項</h4>
                  <p>本サービス内に入力・公開されたテキストやURLは誰でも閲覧可能なパブリックデータとして扱われます。これら公開された情報によって生じたトラブルや損害について、運営者は一切の責任を負いません。ご自身の責任において投稿を行ってください。</p>
                </>
              ) : (
                <>
                  <p>「これ俺の！」をご利用いただきありがとうございます。</p>
                  <p className="mt-4">本サービスは個人開発のプロジェクトです。ご意見、ご要望、不具合の報告、または公開された「起源」に対する重大な異議申し立て等は、以下の窓口までご連絡ください。</p>
                  
                  <div className="bg-slate-50 p-6 rounded-xl mt-6 border border-slate-200">
                    <h4 className="font-bold text-slate-800 mb-2">お問い合わせ窓口</h4>
                    <p className="text-sm text-slate-600 mb-4">下記のお問い合わせフォームよりご連絡をお願いいたします。状況により返信にお時間をいただく場合がございます。</p>
                    <a href="https://oyajibuki.github.io/form/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                      <MessageSquare className="w-4 h-4" /> お問い合わせフォームへ
                    </a>
                  </div>
                </>
              )}
            </div>
            
            <div className="mt-8 text-center">
              <button onClick={() => setInfoModal({ isOpen: false, type: null })} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-8 py-3 rounded-xl transition-colors">
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {editingClaim && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-500" /> {t.editTitle}
              </h3>
              <button onClick={() => setEditingClaim(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">{t.itemLabel}</label>
                <input type="text" value={editingClaim.title} onChange={(e) => setEditingClaim({...editingClaim, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{t.catLabel}</label>
                  <select value={editingClaim.category} onChange={(e) => setEditingClaim({...editingClaim, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                    {CATEGORY_INTERNAL.filter(c => c !== "すべて").map(cat => <option key={cat} value={cat}>{t[catI18nMap[cat]]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{t.dateLabel}</label>
                  <input type="date" value={editingClaim.originDate} onChange={(e) => setEditingClaim({...editingClaim, originDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">{t.urlLabel}</label>
                <input type="url" value={editingClaim.proofUrl} onChange={(e) => setEditingClaim({...editingClaim, proofUrl: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">{t.commentLabel}</label>
                <textarea value={editingClaim.comment || ''} onChange={(e) => setEditingClaim({...editingClaim, comment: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" rows="2"></textarea>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setEditingClaim(null)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg">{t.cancel}</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">{t.editBtn}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="max-w-6xl mx-auto px-4 py-8 border-t border-slate-200 mt-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} これ俺の！(Origin Protocol)</p>
          <div className="flex items-center gap-4">
            <button onClick={() => setInfoModal({ isOpen: true, type: 'privacy' })} className="hover:text-indigo-600 transition-colors">プライバシーポリシー</button>
            <button onClick={() => setInfoModal({ isOpen: true, type: 'support' })} className="hover:text-indigo-600 transition-colors">サポート・運営</button>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}