import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  startOfDay,
  startOfWeek,
} from "date-fns";
import Papa from "papaparse";
import {
  AlertTriangle,
  Bell,
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  CircleHelp,
  Clock3,
  Download,
  Eye,
  EyeOff,
  ExternalLink,
  FileDown,
  Filter,
  LayoutList,
  Maximize2,
  Link2,
  Languages,
  LockKeyhole,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Printer,
  Search,
  Toilet,
  X,
} from "lucide-react";
import {
  seedAvailability,
  seedItems,
  organisations,
  profiles,
} from "./data/seed";
import type {
  AdminResponseStatus,
  AttendancePlan,
  AvailabilityBlock,
  Decision,
  EngagementAccessEvent,
  EngagementIdentity,
  EngagementInvite,
  ItemType,
  MeetingTarget,
  PotentialMeeting,
  Profile,
  ScheduleItem,
  StartupUpdate,
  ViewMode,
} from "./types";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./components/ui/dialog";
import { cn } from "./lib/utils";
import { supabase } from "./lib/supabase";
import { canManageCompanyProposal } from "./lib/access";
import { DatePickerField, FieldLabel, Input, Select } from "./components/form-controls";
import { ExternalEventsPage, LocationPage, OrganisersPage, ToiletMapPage } from "./components/programme-info-pages";
import { AdminEngagementPanel } from "./components/admin-engagement-panel";
import { meetingTargetValues, scheduleItemValues } from "./lib/schedule-persistence";
import {
  bookingLabel,
  calendarState,
  isGenericBusinessMeetingSlot,
  isSupersededDeepFusionMeeting,
  meetingCategoryFor,
  nextWorkingDay,
  overlaps,
  pretty,
  safeDate,
  scheduleDecisionState,
  spreadsheetTypeFor,
} from "./lib/schedule-domain";
import {
  mapAvailabilityRow,
  mapPotentialMeetingRow,
  mapScheduleItemRow,
  mapStartupUpdateRow,
} from "./lib/supabase-mappers";

const itemMeta: Record<
  ItemType,
  { label: string; dot: string; card: string; accent: string }
> = {
  lvnc_core: {
    label: "Programme",
    dot: "bg-indigo-600",
    card: "border-indigo-200 bg-indigo-50/80",
    accent: "text-indigo-700",
  },
  third_party: {
    label: "Third-party event",
    dot: "bg-amber-500",
    card: "border-amber-200 bg-amber-50/80",
    accent: "text-amber-800",
  },
  business_meeting: {
    label: "Open for business meetings",
    dot: "bg-teal-600",
    card: "border-teal-200 bg-teal-50/80",
    accent: "text-teal-800",
  },
  company_work: {
    label: "Company work",
    dot: "bg-slate-500",
    card: "border-slate-300 bg-slate-100/80",
    accent: "text-slate-700",
  },
};

type Language = "en" | "ko";
const uiText = {
  en: {
    schedule: "Schedule",
    businessMeetings: "Potential Biz Meets",
    cohortDecisions: "Cohort Retention",
    myDecisions: "My decisions",
    venueLocation: "Venue Location",
    toiletMap: "UK Toilet Map",
    externalLinks: "External event links",
    hotelRecs: "Hotel Recs",
    tutorial: "Tutorial",
    addCompanyWork: "Add company work",
    organisers: "Investor Showcase",
    investorShowcase: "Investor Showcase",
    collapse: "Collapse panel",
    expand: "Expand panel",
    language: "한국어",
    programmeSchedule: "Programme schedule",
    calendar: "Calendar",
    spreadsheet: "Spreadsheet",
    undo: "Undo",
    redo: "Redo",
    searchSchedule: "Search schedule",
    createItem: "Create item",
    proposeEvent: "Propose event",
    export: "Export",
    jumpToday: "Jump To Today",
    key: "Key",
    confirmed: "Confirmed",
    decisionPending: "Decision pending",
    businessIntro:
      "Select an institution or person below to see further details and, where available, an external profile or event link.",
  },
  ko: {
    schedule: "일정",
    businessMeetings: "비즈니스 미팅",
    cohortDecisions: "코호트 결정",
    myDecisions: "나의 결정",
    venueLocation: "행사 장소",
    toiletMap: "영국 화장실 지도",
    externalLinks: "외부 행사 링크",
    addCompanyWork: "회사 업무 추가",
    organisers: "투자자 쇼케이스",
    investorShowcase: "투자자 쇼케이스",
    collapse: "패널 접기",
    expand: "패널 펼치기",
    language: "English",
    programmeSchedule: "프로그램 일정",
    calendar: "캘린더",
    spreadsheet: "스프레드시트",
    undo: "실행 취소",
    redo: "다시 실행",
    searchSchedule: "일정 검색",
    createItem: "항목 만들기",
    proposeEvent: "행사 제안",
    export: "내보내기",
    jumpToday: "오늘로 이동",
    key: "범례",
    confirmed: "확정",
    decisionPending: "결정 대기",
    businessIntro:
      "프로그램 기간 중 가능한 미팅 및 소개입니다. LVCN은 전체 조정 정보를 보고, 참가 회사에는 관련 여부를 결정하는 데 필요한 정보만 표시됩니다.",
  },
} as const;

const koreanUiText = {
  ...uiText.en,
  language: "\uD55C\uAD6D\uC5B4",
  schedule: "\uC77C\uC815",
  businessMeetings: "\uCD94\uCC9C \uBE44\uC988\uB2C8\uC2A4 \uAE30\uD68C",
  cohortDecisions: "\uCF54\uD638\uD2B8 \uACB0\uC815",
  myDecisions: "\uB098\uC758 \uACB0\uC815",
  venueLocation: "\uD589\uC0AC \uC7A5\uC18C",
  toiletMap: "\uC601\uAD6D \uD654\uC7A5\uC2E4 \uC9C0\uB3C4",
  externalLinks: "\uC678\uBD80 \uD589\uC0AC \uB9C1\uD06C",
  hotelRecs: "\uD638\uD154 \uCD94\uCC9C",
  tutorial: "\uC0AC\uC6A9 \uC548\uB0B4",
  addCompanyWork: "\uD68C\uC0AC \uC5C5\uBB34 \uCD94\uAC00",
  organisers: "\uD22C\uC790\uC790 \uC1FC\uCF00\uC774\uC2A4",
  investorShowcase: "\uD22C\uC790\uC790 \uC1FC\uCF00\uC774\uC2A4",
  collapse: "\uD328\uB110 \uC811\uAE30",
  expand: "\uD328\uB110 \uD3BC\uCE58\uAE30",
  programmeSchedule: "\uD504\uB85C\uADF8\uB7A8 \uC77C\uC815",
  calendar: "\uCE98\uB9B0\uB354",
  spreadsheet: "\uC2A4\uD504\uB808\uB4DC\uC2DC\uD2B8",
  undo: "\uC2E4\uD589 \uCDE8\uC18C",
  redo: "\uB2E4\uC2DC \uC2E4\uD589",
  searchSchedule: "\uC77C\uC815 \uAC80\uC0C9",
  createItem: "\uD56D\uBAA9 \uB9CC\uB4E4\uAE30",
  proposeEvent: "\uD589\uC0AC \uC81C\uC548",
  export: "\uB0B4\uBCF4\uB0B4\uAE30",
  jumpToday: "\uC624\uB298\uB85C \uC774\uB3D9",
  key: "\uBC94\uB840",
  confirmed: "\uD655\uC815",
  decisionPending: "\uACB0\uC815 \uB300\uAE30",
  businessIntro:
    "\uC544\uB798\uC758 \uAE30\uAD00 \uB610\uB294 \uB2F4\uB2F9\uC790\uB97C \uC120\uD0DD\uD558\uBA74 \uC0C1\uC138 \uC815\uBCF4\uC640, \uC81C\uACF5\uB418\uB294 \uACBD\uC6B0 \uC678\uBD80 \uD504\uB85C\uD544 \uB610\uB294 \uD589\uC0AC \uB9C1\uD06C\uB97C \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
} as const;

const dateLabel = (item: ScheduleItem) =>
  item.startsAt
    ? item.timePrecision === "all_day"
      ? `${format(new Date(item.startsAt), "EEE d MMM")} · All day`
      : format(new Date(item.startsAt), "EEE d MMM · HH:mm")
    : "Time to confirm";

// Keep detailed source labels on each record, while grouping them into a
// compact, startup-friendly taxonomy for the Potential Biz Meets filters.
const meetingCategoryLabel = (category: string) => {
  const value = category.trim().toLowerCase();
  if (!value) return "Other";
  if (value.includes("invest") || value.includes("venture") || value.includes("capital") || value.includes("finance") || value.includes("funding") || value.includes("vc") || value.includes("founder investor")) return "Investor";
  if (value.includes("advertis") || value.includes("agency")) return "Advertising & agency partners";
  if (value.includes("creative") || value.includes("media") || value.includes("communications") || value.includes("pr /")) return "Creative & media ecosystem";
  if (value.includes("compliance") || value.includes("regulatory") || value.includes("regulation") || value.includes("certification") || value.includes("standards") || value.includes("data protection") || value.includes("notified body") || value.includes("quality")) return "Regulation & compliance";
  if (value.includes("clinical") || value.includes("research") || value.includes("academic") || value.includes("university") || value.includes("neuroscience") || value.includes("parkinson")) return "Research & clinical";
  if (value.includes("nhs") || value.includes("hospital") || value.includes("healthcare") || value.includes("healthtech") || value.includes("digital health") || value.includes("pharmacy") || value.includes("patient") || value.includes("life science") || value.includes("life-science") || value.includes("pharma")) return "Healthcare & NHS";
  if (value.includes("distribution") || value.includes("sales") || value.includes("market access") || value.includes("commercial") || value.includes("retail")) return "Sales & distribution";
  if (value.includes("manufactur") || value.includes("ems") || value.includes("electronics") || value.includes("aerospace") || value.includes("industrial") || value.includes("battery")) return "Manufacturing & industrial";
  if (value.includes("automation") || value.includes("robotics") || value.includes("systems integration")) return "Automation & robotics";
  if (value.includes("defence") || value.includes("security") || value.includes("mobility") || value.includes("automotive")) return "Defence & mobility";
  if (value.includes("corporate") || value.includes("strategic") || value.includes("enterprise") || value.includes("partner") || value.includes("innovation")) return "Strategic & corporate partners";
  if (value.includes("technology") || value.includes("digital") || value.includes("ecosystem") || value.includes("ai")) return "Technology ecosystem";
  if (value.includes("internal team")) return "Internal team";
  return "Other";
};

const potentialMeetingRelevance = (meeting: PotentialMeeting, language: Language) => {
  if (language !== "ko" || meeting.organisationId !== "99999999-9999-4999-8999-999999999996")
    return meeting.startupVisibleNote;
  switch (meetingCategoryLabel(meeting.category)) {
    case "Investor":
      return "현재 투자 라운드를 위한 잠재 투자자 미팅 기회입니다. 소개 전 투자 단계와 산업 적합성을 확인합니다.";
    case "Other":
      return "현재 투자 라운드와 전략적 파트너십 모두에 연결될 수 있는 기업형 벤처투자 기회입니다. 소개 전 투자·사업 협력 적합성을 확인합니다.";
    case "Manufacturing & industrial":
      return "Pillarhouse 협력 및 EMS 네트워킹 목표와 직접 연결됩니다. Power Auto System의 소개를 통해 PA Robotics 삽입기와 Pillarhouse 솔더링 시스템을 통합 SMT 라인 솔루션으로 논의할 수 있습니다.";
    case "Automation & robotics":
      return "Pillarhouse 협력 및 EMS 네트워킹 목표를 지원합니다. 관련 제조사·시스템 통합업체·EMS 기업과 통합 SMT 라인 적용 가능성을 논의할 수 있는 경로입니다.";
    case "Sales & distribution":
      return "영국 판매 파트너 목표를 지원합니다. 전자·산업 자동화 고객 기반을 가진 유통사 또는 판매 대리점 후보를 발굴할 수 있습니다.";
    case "Regulation & compliance":
      return "영국 판매 파트너 확보에 필요한 기술·시장 준비를 지원합니다. 유통사나 판매 대리점이 요구할 안전·규제·품질 준비 사항을 확인할 수 있습니다.";
    case "Strategic & corporate partners":
      return "PA Robotics의 영국 프로그램 목표를 지원하는 전략적 파트너 경로입니다. EMS 고객, 제조 파트너 또는 영국 판매 채널로 이어질 가능성을 확인합니다.";
    default:
      return meeting.startupVisibleNote
        ? "PA Robotics의 영국 프로그램 목표와 관련된 기회입니다. EMS 고객·전략 파트너·투자자·영국 판매 채널 중 가장 적합한 연결 목적을 확인한 뒤 진행합니다."
        : undefined;
  }
};

// Curated first-party profiles and official event pages for the imported
// Deep Fusion AI and FUST Lab records. Deliberately do not invent a link for
// an unmatched title: an empty value is clearer than an unreliable result.
const officialExternalLinks: Record<string, string> = {
  "MD One": "https://www.mdone.vc/",
  "Mentor Meeting with Edward Ebbern (MD One)": "https://www.mdone.vc/",
  "Seraphim Space": "https://seraphim.vc/",
  "Octopus Ventures": "https://octopusventures.com/",
  "Foresight Group": "https://www.foresightgroup.eu/",
  "NATO Innovation Fund": "https://www.nif.fund/",
  "In Motion Ventures (JLR CVC)": "https://www.inmotionventures.com/",
  "Prosus Ventures": "https://www.prosusventures.com/",
  "Molten Ventures": "https://www.moltenventures.com/",
  "GB Ventures": "https://gb.vc/",
  "IQ Capital": "https://iqcapital.vc/",
  "Amadeus Capital Partners": "https://amadeuscapital.com/",
  "DASA (Defence and Security Accelerator)": "https://www.gov.uk/government/organisations/defence-and-security-accelerator",
  "BAE Systems (FalconWorks)": "https://www.baesystems.com/en-uk",
  QinetiQ: "https://www.qinetiq.com/",
  "Thales UK": "https://www.thalesgroup.com/en/countries-europe/uk",
  "Leonardo UK": "https://uk.leonardo.com/en",
  "Chess Dynamics (Elbit Systems UK)": "https://elbitsystems.com/",
  "MBDA UK": "https://www.mbda-systems.com/country-uk",
  "Saab UK": "https://www.saab.com/markets/united-kingdom",
  "Rolls-Royce (Defence)": "https://www.rolls-royce.com/products-and-services/defence.aspx",
  "Frazer-Nash Consultancy": "https://www.fnc.co.uk/",
  NSSIF: "https://www.nssif.co.uk/",
  Dstl: "https://www.gov.uk/government/organisations/defence-science-and-technology-laboratory",
  "NATO DIANA": "https://www.diana.nato.int/",
  "Cohort plc": "https://www.cohortplc.com/",
  "Ahren Innovation Capital": "https://www.ahreninnovationcapital.com/",
  "Paladin Capital Group": "https://www.paladincapgroup.com/",
  "BGF Early Stage": "https://www.bgf.co.uk/",
  "Cambridge Innovation Capital": "https://www.cic.vc/",
  "Parkwalk Advisors": "https://parkwalkadvisors.com/",
  "Atlantic Bridge": "https://www.abven.com/",
  AlbionVC: "https://www.albion.vc/",
  "Balderton Capital": "https://www.balderton.com/",
  Atomico: "https://atomico.com/",
  Lakestar: "https://www.lakestar.com/",
  Northzone: "https://northzone.com/",
  "EQT Ventures": "https://eqtventures.com/",
  "Dawn Capital": "https://dawncapital.com/",
  "Highland Europe": "https://www.highlandeurope.com/",
  "M&G Catalyst": "https://www.mandg.com/",
  "Schroders Capital": "https://www.schroders.com/en-gb/uk/institutional/capabilities/private-assets/",
  "British Patient Capital": "https://www.britishpatientcapital.co.uk/",
  "Future Fund: Breakthrough": "https://www.british-business-bank.co.uk/finance-options/debt-finance/future-fund-breakthrough",
  "SoftBank Vision Fund": "https://group.softbank/en/ir/vision-fund",
  "General Catalyst": "https://www.generalcatalyst.com/",
  "Lux Capital": "https://www.luxcapital.com/",
  DCVC: "https://www.dcvc.com/",
  Eclipse: "https://eclipse.vc/",
  "Playground Global": "https://playground.global/",
  "E14 Fund": "https://e14fund.com/",
  "Longwall Ventures": "https://longwallventures.com/",
  "Northern Gritstone": "https://www.northern-gritstone.com/",
  "MMC Ventures": "https://mmc.vc/",
  "Crane Venture Partners": "https://www.crane.vc/",
  "Entrepreneur First": "https://www.joinef.com/",
  LocalGlobe: "https://localglobe.vc/",
  Seedcamp: "https://seedcamp.com/",
  "Hoxton Ventures": "https://www.hoxtonventures.com/",
  "Notion Capital": "https://www.notion.vc/",
  "Kindred Capital": "https://kindredcapital.vc/",
  "Frontline Ventures": "https://frontline.vc/",
  Beringea: "https://beringea.com/",
  Speedinvest: "https://www.speedinvest.com/",
  "OTB Ventures": "https://otb.vc/",
  Zenzic: "https://zenzic.io/",
  "HORIBA MIRA": "https://www.horiba-mira.com/",
  "Millbrook Proving Ground": "https://www.utac.com/",
  "Smart Mobility Living Lab": "https://smartmobilitylivinglab.com/",
  Oxbotica: "https://www.oxbotica.com/",
  Wayve: "https://wayve.ai/",
  "Connected Places Catapult": "https://cp.catapult.org.uk/",
  "Teledyne e2v": "https://www.teledyne-e2v.com/",
  Plexal: "https://www.plexal.com/",
  "AI Dinner Club": "https://aidinner.co.uk/",
  "Sifted Summit - Day 1": "https://sifted.eu/summit",
  "Sifted Summit - Day 2": "https://sifted.eu/summit",
  "Deep Tech London kickoff with Singular and Seedcamp": "https://www.deeptech.london/",
  "The Automotive Forum": "https://www.eumw.eu/conferences/forums/automotive-forum/",
  "SMMT Regional Networking (North)": "https://www.smmt.co.uk/events/",
  "The Defence Forum": "https://www.eumw.eu/conferences/forums/defence-forum/",
  "EuRAD Conference": "https://www.eumw.eu/conference/the-european-radar-conference-eurad/",
  "Trusted Research & Secure Innovation Summit": "https://www.techuk.org/what-we-deliver/flagship-and-sponsored-events/trusted-research-and-secure-innovation-summit.html",
  "Founder Pitch Challenge 2026": "https://www.eventbrite.co.uk/e/founder-pitch-challenge-2026-london-tide-hq-compete-for-a-share-of-5k-tickets-1996432529438",
  "Birmingham Tech Week - International Networking Reception": "https://birminghamtechweek.com/",
  "Birmingham Tech Week - Global Village": "https://birminghamtechweek.com/",
  "Birmingham Tech Week - Scale Up Games Final": "https://birminghamtechweek.com/",
  "Birmingham Tech Week - Investment Dinner": "https://birminghamtechweek.com/",
  "Birmingham Tech Week - ScaleUp Summit": "https://birminghamtechweek.com/",
  "Encode London Hackathon and Conference": "https://luma.com/encode-london-2026",
  "IWA World Water Congress & Exhibition": "https://worldwatercongress.org/",
  "IWA World Water Congress or Cranfield Water Alumni Reception": "https://worldwatercongress.org/",
  "SUEZ Satellite User Forum — Smart Water & Wastewater": "https://www.suez.com/en",
  "Women on Water Conference & Reception": "https://www.britishwater.co.uk/page/events",
};

const officialExternalLinkFor = (item: ScheduleItem) => {
  const normalisedTitle = item.title.replaceAll("â€”", "—").trim();
  return item.eventUrl || officialExternalLinks[normalisedTitle];
};

export default function App({
  initialProfile,
  productionMode = false,
}: {
  initialProfile?: Profile;
  productionMode?: boolean;
}) {
  const [profile, setProfile] = useState<Profile>(
    initialProfile ?? profiles[0],
  );
  const [items, setItems] = useState(productionMode ? [] : seedItems);
  const [potentialMeetings, setPotentialMeetings] = useState<PotentialMeeting[]>([]);
  const [startupUpdates, setStartupUpdates] = useState<StartupUpdate[]>([]);
  const [engagementEvents, setEngagementEvents] = useState<EngagementAccessEvent[]>([]);
  const [engagementIdentities, setEngagementIdentities] = useState<EngagementIdentity[]>([]);
  const [engagementInvites, setEngagementInvites] = useState<EngagementInvite[]>([]);
  const [updatesSchemaReady, setUpdatesSchemaReady] = useState(!productionMode);
  const [organisationNames, setOrganisationNames] = useState<Record<string, string>>({});
  const [, setHiddenMeetingCategories] = useState<
    string[]
  >(productionMode ? [] : ["Business meeting"]);
  // Retained temporarily for the legacy schedule editor during the migration.
  const [hiddenBusinessMeetingColumns, setHiddenBusinessMeetingColumns] = useState<string[]>([]);
  const [hiddenSections, setHiddenSections] = useState<string[]>(
    productionMode ? [] : ["toilets"],
  );
  const [undoStack, setUndoStack] = useState<ScheduleItem[][]>([]);
  const [redoStack, setRedoStack] = useState<ScheduleItem[][]>([]);
  const [availability, setAvailability] = useState(
    productionMode ? [] : seedAvailability,
  );
  const [selectedId, setSelectedId] = useState<string>();
  const [highlightMeetingNote, setHighlightMeetingNote] = useState(false);
  const [page, setPage] = useState<
    | "calendar"
    | "business-meetings"
    | "admin-hub"
    | "admin-inbox"
    | "admin-reporting"
    | "updates"
    | "decisions"
    | "organisers"
    | "location"
    | "hotel-recs"
    | "toilets"
    | "external-events"
  >(initialProfile?.role === "lvnc_admin" ? "admin-hub" : "calendar");
  const [week, setWeek] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [view, setView] = useState<ViewMode>(() =>
    window.innerWidth < 768 ? "day" : "week",
  );
  const [scheduleMode, setScheduleMode] = useState<"calendar" | "spreadsheet">(
    () =>
      initialProfile?.role === "lvnc_admin" || initialProfile?.role === "startup_member"
        ? "spreadsheet"
        : "calendar",
  );
  const [mobileMenu, setMobileMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDefaultType] = useState<ItemType>();
  const [createRange, setCreateRange] = useState<{
    startsAt?: string;
    endsAt?: string;
  }>({});
  const [editOpen, setEditOpen] = useState(false);
  const [busyOpen, setBusyOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [organisationFilter, setOrganisationFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string>();
  const [exportState, setExportState] = useState<
    { kind: "excel" | "pdf"; progress: number } | undefined
  >();
  const exportCancelled = useRef(false);
  const historySyncRef = useRef(Promise.resolve());
  const [language, setLanguage] = useState<Language>(() =>
    window.localStorage.getItem("lvcn-language") === "ko" ? "ko" : "en",
  );
  const isAdmin = profile.role === "lvnc_admin";
  const isPartnerObserver = profile.role === "partner_observer";
  useEffect(() => {
    window.localStorage.setItem("lvcn-language", language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const client = supabase;
    if (!productionMode || !client) return;
    let loading = false;
    let disposed = false;
    const load = async () => {
      if (loading || disposed) return;
      loading = true;
      try {
      const scheduleSelect =
        "*, schedule_item_organisations(organisation_id,meeting_outreach_status,availability_note,coordination_note), event_responses(id,organisation_id,decision,note,updated_at,admin_reviewed_at,attendance_plan,attendance_starts_at,attendance_ends_at,conversation_status,admin_response_status,event_response_messages(id,body,author_role,created_at)), schedule_item_conflict_groups(conflict_group_id)";
      const legacyScheduleSelect =
        "*, schedule_item_organisations(organisation_id), event_responses(organisation_id,decision,note,updated_at,admin_reviewed_at), schedule_item_conflict_groups(conflict_group_id)";
      let scheduleResult = await client
        .from(profile.role === "lvnc_admin" ? "schedule_items" : "schedule_events")
        .select(scheduleSelect)
        .order("starts_at", { ascending: true, nullsFirst: false });
      // Keep the board usable while an administrator is applying the optional
      // per-startup coordination migration.
      if (scheduleResult.error)
        scheduleResult = await client
          .from("schedule_items")
          .select(legacyScheduleSelect)
          .neq("item_type", "business_meeting")
          .neq("status", "cancelled")
          .not("starts_at", "is", null)
          .order("starts_at", { ascending: true, nullsFirst: false });
      const [
        { data: availabilityRows, error: availabilityError },
        { data: categoryRows, error: categoryError },
        { data: sectionRows, error: sectionError },
        { data: potentialRows, error: potentialError },
        { data: columnRows, error: columnVisibilityError },
      ] = await Promise.all([
        client
          .from("availability_blocks")
          .select("id,organisation_id,title,note,starts_at,ends_at,admin_reviewed_at")
          .order("starts_at"),
        client
          .from("meeting_category_visibility")
          .select("category,visible_to_startups"),
        client.from("app_section_visibility").select("section_id,visible_to_startups"),
        client
          .from("potential_meetings")
          .select("*, potential_meeting_admin_details(contact_name,contact_email,internal_note), potential_meeting_decisions(decision,note,priority_rating,admin_reviewed_at)")
          .order("institution_name"),
        client.from("business_meeting_column_visibility").select("column_id,visible_to_startups"),
      ]);
      const updatesResult = await client
        .from("startup_updates")
        .select("id,organisation_id,kind,title,body,schedule_item_id,potential_meeting_id,created_at,read_at")
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(30);
      if (disposed) return;
      if (scheduleResult.error || availabilityError || categoryError || sectionError || potentialError) {
        setToast(
          scheduleResult.error?.message ??
            availabilityError?.message ??
            categoryError?.message ??
            sectionError?.message ??
            potentialError?.message ??
            "Could not load programme",
        );
        return;
      }
      // Keep the shared startup-visibility settings in state for both roles.
      // Admins still render the complete coordination table, but their toggle
      // controls must reflect what startup accounts will actually see.
      if (!columnVisibilityError) {
        setHiddenBusinessMeetingColumns((columnRows ?? []).filter((row: any) => !row.visible_to_startups).map((row: any) => row.column_id));
      }
      setPotentialMeetings((potentialRows ?? []).map(mapPotentialMeetingRow));
      if (updatesResult.error) {
        setUpdatesSchemaReady(false);
        setStartupUpdates([]);
      } else {
        setUpdatesSchemaReady(true);
        setStartupUpdates((updatesResult.data ?? []).map(mapStartupUpdateRow));
      }
      setItems((scheduleResult.data ?? []).map(mapScheduleItemRow));
      setHiddenMeetingCategories(
        (categoryRows ?? [])
          .filter((row: any) => !row.visible_to_startups)
          .map((row: any) => row.category),
      );
      setHiddenSections(
        (sectionRows ?? [])
          .filter((row: any) => !row.visible_to_startups)
          .map((row: any) => row.section_id),
      );
      setAvailability((availabilityRows ?? []).flatMap((row: any) => {
        const mapped = mapAvailabilityRow(row);
        return mapped ? [mapped] : [];
      }));
      void client.from("organisations").select("id,name").then(({ data }) => {
        if (data && !disposed) setOrganisationNames(Object.fromEntries(data.map((row: any) => [row.id, row.name])));
      });
      } catch {
        if (!disposed) setToast("Could not refresh programme data. Your last loaded view is preserved; retry when connected.");
      } finally {
        loading = false;
      }
    };
    void load();
    window.addEventListener("programme-refresh", load);
    return () => { disposed = true; window.removeEventListener("programme-refresh", load); };
  }, [productionMode, profile.role]);

  const recordedSession = useRef<string | undefined>(undefined);
  useEffect(() => {
    const client = supabase;
    if (!productionMode || !client || profile.role === "lvnc_admin" || !profile.organisationId || recordedSession.current === profile.id) return;
    recordedSession.current = profile.id;
    void client.from("app_activity_events").insert({ actor_id: profile.id, organisation_id: profile.organisationId, event_type: "session_started" }).then(({ error }) => {
      if (error) console.warn("Could not record programme access", error.message);
    });
  }, [productionMode, profile.id, profile.role, profile.organisationId]);

  useEffect(() => {
    const client = supabase;
    if (!productionMode || !client || profile.role !== "lvnc_admin" || page !== "decisions") return;
    let disposed = false;
    const loadEngagement = async () => {
      const [{ data: identityRows, error: identityError }, { data: inviteRows, error: inviteError }] = await Promise.all([
        client.from("profiles").select("id,email,full_name,role,organisation_id"),
        client.from("allowed_invites").select("email,full_name,role,organisation_id"),
      ]);
      if (identityError || inviteError || disposed) return;

      const activityRows: any[] = [];
      const pageSize = 1000;
      for (let from = 0; ; from += pageSize) {
        const { data, error } = await client
          .from("app_activity_events")
          .select("actor_id,organisation_id,occurred_at")
          .order("occurred_at", { ascending: false })
          .range(from, from + pageSize - 1);
        if (error || disposed) return;
        activityRows.push(...(data ?? []));
        if ((data ?? []).length < pageSize) break;
      }
      if (disposed) return;
      setEngagementEvents(activityRows.map((row) => ({ actorId: row.actor_id, organisationId: row.organisation_id, occurredAt: row.occurred_at })));
      setEngagementIdentities((identityRows ?? []).map((row: any) => ({ id: row.id, email: row.email, fullName: row.full_name ?? undefined, role: row.role, organisationId: row.organisation_id ?? undefined })));
      setEngagementInvites((inviteRows ?? []).map((row: any) => ({ email: row.email, fullName: row.full_name ?? undefined, role: row.role, organisationId: row.organisation_id ?? undefined })));
    };
    void loadEngagement();
    const refreshTimer = window.setInterval(loadEngagement, 15000);
    window.addEventListener("focus", loadEngagement);
    return () => {
      disposed = true;
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", loadEngagement);
    };
  }, [page, productionMode, profile.role]);

  useEffect(() => {
    const client = supabase;
    if (!productionMode || !client) return;
    let subscribed = false;
    let disposed = false;
    const refresh = () => {
      if (!disposed && document.visibilityState === "visible" && navigator.onLine)
        window.dispatchEvent(new Event("programme-refresh"));
    };
    // A successful WebSocket subscription does not guarantee that every
    // database publication is delivering row events. Poll visible foreground
    // views as a backstop so an admin inbox cannot remain stale after a
    // startup decision, message, or company-time update.
    const fallback = window.setInterval(refresh, 5000);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    const channel = client
      .channel("programme-live-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "schedule_items" },
        () => window.dispatchEvent(new Event("programme-refresh")),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "potential_meetings" }, () => window.dispatchEvent(new Event("programme-refresh")))
      .on("postgres_changes", { event: "*", schema: "public", table: "potential_meeting_decisions" }, () => window.dispatchEvent(new Event("programme-refresh")))
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_responses" },
        () => window.dispatchEvent(new Event("programme-refresh")),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "availability_blocks" },
        () => window.dispatchEvent(new Event("programme-refresh")),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meeting_category_visibility" },
        () => window.dispatchEvent(new Event("programme-refresh")),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_section_visibility" },
        () => window.dispatchEvent(new Event("programme-refresh")),
      )
      .subscribe((status) => {
        subscribed = status === "SUBSCRIBED";
        if (subscribed) refresh();
      });
    return () => {
      disposed = true;
      window.clearInterval(fallback);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refresh);
      void client.removeChannel(channel);
    };
  }, [productionMode]);

  const visibleItems = useMemo(
    () =>
      items.filter((item) => {
        const publishable =
          item.status !== "cancelled" &&
          (item.itemType === "lvnc_core"
            ? item.status === "confirmed"
            : item.status === "confirmed" || item.status === "proposed");
        const allowed =
          item.status !== "cancelled" &&
          (isAdmin || isPartnerObserver ||
            (publishable &&
              (item.visibilityScope === "cohort" ||
                item.organisationIds.includes(profile.organisationId!))));
        // For admins, MASTER TEMPLATE is deliberately limited to true
        // cohort-wide core programme events. Bespoke events must be opened via
        // a startup filter and can never crowd the shared template.
        const orgMatch = isPartnerObserver
          ? organisationFilter === "all" || item.visibilityScope === "cohort" || item.organisationIds.includes(organisationFilter)
          : isAdmin && organisationFilter === "all"
            ? item.itemType === "lvnc_core" && item.visibilityScope === "cohort" && item.organisationIds.length === 0
            : organisationFilter === "all"
              ? item.visibilityScope === "cohort" || item.organisationIds.includes(profile.organisationId ?? "")
              : item.visibilityScope === "cohort" || item.organisationIds.includes(organisationFilter);
        const declinedByStartup = !isAdmin && !isPartnerObserver && item.responses.some(
          (response) => response.organisationId === profile.organisationId && response.decision === "pass",
        );
        return (
          allowed &&
          !declinedByStartup &&
          item.itemType !== "business_meeting" &&
          Boolean(item.startsAt) &&
          ((isAdmin || isPartnerObserver) || !isSupersededDeepFusionMeeting(item)) &&
          orgMatch &&
          (typeFilter === "all" || item.itemType === typeFilter) &&
          (organisationFilter === "all" || statusFilter === "all" || scheduleDecisionState(item, organisationFilter) === statusFilter) &&
          item.title.toLowerCase().includes(search.toLowerCase())
        );
      }),
    [
      items,
      isAdmin, isPartnerObserver,
      profile.organisationId,
      organisationFilter,
      typeFilter,
      statusFilter,
      search,
    ],
  );
  const decisionItems = useMemo(
    () => items.filter((item) => {
      const publishable = item.status !== "cancelled" && (item.itemType === "lvnc_core" ? item.status === "confirmed" : item.status === "confirmed" || item.status === "proposed");
      return item.itemType !== "business_meeting" && Boolean(item.startsAt) && (isAdmin || isPartnerObserver || (publishable && (item.visibilityScope === "cohort" || item.organisationIds.includes(profile.organisationId!)))) && ((isAdmin || isPartnerObserver) || !isSupersededDeepFusionMeeting(item));
    }),
    [items, isAdmin, isPartnerObserver, profile.organisationId],
  );

  const visibleAvailability = availability.filter(
    (block) => isAdmin || (!isPartnerObserver && block.organisationId === profile.organisationId),
  );
  const selected = items.find((item) => item.id === selectedId);
  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(undefined), 2400);
  };
  const setItemsWithHistory = (
    updater: (current: ScheduleItem[]) => ScheduleItem[],
  ) => {
    setItems((current) => {
      setUndoStack((past) => [...past.slice(-19), current]);
      setRedoStack([]);
      return updater(current);
    });
  };
  const undoItems = () => {
    const previous = undoStack.at(-1);
    if (!previous) return;
    setUndoStack((current) => current.slice(0, -1));
    setItems((current) => {
      setRedoStack((future) => [...future.slice(-19), current]);
      void restoreHistoryItems(current, previous, "Undo");
      return previous;
    });
  };
  const redoItems = () => {
    const next = redoStack.at(-1);
    if (!next) return;
    setRedoStack((current) => current.slice(0, -1));
    setItems((current) => {
      setUndoStack((past) => [...past.slice(-19), current]);
      void restoreHistoryItems(current, next, "Redo");
      return next;
    });
  };

  const saveDecision = async (
    target: ScheduleItem,
    decision: Decision,
    note?: string,
    attendancePlan: AttendancePlan = "not_set",
    attendanceStartsAt?: string,
    attendanceEndsAt?: string,
  ) => {
    if (!profile.organisationId) return;
    const organisationId = profile.organisationId;
    const previousResponse = target.responses.find(
      (response) => response.organisationId === organisationId,
    );
    const createsConflict = Boolean(
      target.conflictGroupId &&
        ["going", "interested"].includes(decision) &&
        items.some(
          (item) =>
            item.id !== target.id &&
            item.conflictGroupId === target.conflictGroupId &&
            item.responses.some(
              (response) =>
                response.organisationId === profile.organisationId &&
                ["going", "interested"].includes(response.decision),
            ),
        ),
    );
    setItemsWithHistory((current) =>
      current.map((item) =>
        item.id !== target.id
          ? item
          : {
              ...item,
              responses: [
                ...item.responses.filter(
                  (response) =>
                    response.organisationId !== organisationId,
                ),
                {
                  id: previousResponse?.id,
                  organisationId,
                  decision,
                  note,
                  updatedAt: new Date().toISOString(),
                  adminReviewedAt: undefined,
                  attendancePlan,
                  attendanceStartsAt,
                  attendanceEndsAt,
                  conversationStatus: note?.trim() ? "awaiting_admin" : previousResponse?.conversationStatus,
                  adminResponseStatus: undefined,
                  messages: previousResponse?.messages,
                },
              ],
            },
      ),
    );
    if (productionMode && supabase) {
      const { error } = await supabase.from("event_responses").upsert(
        {
          schedule_item_id: target.id,
          organisation_id: organisationId,
          decision,
          note: note || null,
          attendance_plan: attendancePlan,
          attendance_starts_at: attendanceStartsAt || null,
          attendance_ends_at: attendanceEndsAt || null,
          conversation_status: note?.trim() ? "awaiting_admin" : previousResponse?.conversationStatus ?? "none",
          admin_response_status: note?.trim() ? null : previousResponse?.adminResponseStatus ?? null,
          updated_by: profile.id,
          admin_reviewed_at: null,
          admin_reviewed_by: null,
        },
        { onConflict: "schedule_item_id,organisation_id" },
      );
      if (error) {
        setItems((current) =>
          current.map((item) =>
            item.id !== target.id
              ? item
              : {
                  ...item,
                  responses: [
                    ...item.responses.filter(
                      (response) => response.organisationId !== organisationId,
                    ),
                    ...(previousResponse ? [previousResponse] : []),
                  ],
                },
          ),
        );
        showToast(`Decision could not be saved: ${error.message}`);
        return;
      }
      if (note?.trim() && previousResponse?.note?.trim() !== note.trim()) {
        const { data: savedResponse } = await supabase
          .from("event_responses")
          .select("id")
          .eq("schedule_item_id", target.id)
          .eq("organisation_id", organisationId)
          .single();
        if (savedResponse) {
          const { error: messageError } = await supabase.from("event_response_messages").insert({
            event_response_id: savedResponse.id,
            body: note.trim(),
            author_id: profile.id,
            author_role: "startup_member",
          });
          if (messageError) showToast(`Decision saved, but message could not be sent: ${messageError.message}`);
        }
      }
    }
    showToast(
      createsConflict
        ? "Saved — check the alternative-choice conflict"
        : decision === "pass"
          ? "Decision saved; LVCN has been notified"
          : "Decision saved",
    );
  };
  const updateDecision = (decision: Decision, note?: string, attendancePlan?: AttendancePlan, attendanceStartsAt?: string, attendanceEndsAt?: string) => {
    if (selected) saveDecision(selected, decision, note, attendancePlan, attendanceStartsAt, attendanceEndsAt);
  };
  const markStartupUpdatesRead = async () => {
    const unread = startupUpdates.filter((update) => !update.readAt);
    if (!unread.length) return;
    const readAt = new Date().toISOString();
    setStartupUpdates((current) => current.map((update) => update.readAt ? update : { ...update, readAt }));
    if (productionMode && supabase) {
      const { error } = await supabase.from("startup_updates").update({ read_at: readAt }).in("id", unread.map((update) => update.id));
      if (error) showToast(`Updates could not be marked read: ${error.message}`);
    }
  };
  const sendStartupUpdate = async (organisationId: string, title: string, body: string) => {
    if (!productionMode || !supabase) return;
    const { data, error } = await supabase.from("startup_updates").insert({ organisation_id: organisationId, kind: "admin_message", title, body: body || null, created_by: profile.id }).select().single();
    if (error) { showToast(`Message could not be sent: ${error.message}`); return; }
    if (data) setStartupUpdates((current) => [{ id: data.id, organisationId: data.organisation_id, kind: data.kind, title: data.title, body: data.body ?? undefined, createdAt: data.created_at }, ...current]);
    showToast("Startup update sent");
  };
  const savePotentialMeeting = async (meeting: PotentialMeeting) => {
    const before = potentialMeetings;
    setPotentialMeetings((current) => {
      const exists = current.some((entry) => entry.id === meeting.id);
      return exists ? current.map((entry) => entry.id === meeting.id ? meeting : entry) : [...current, meeting];
    });
    if (!productionMode || !supabase) {
      showToast("Potential Biz Meet saved");
      return;
    }
    const values = {
      organisation_id: meeting.organisationId, institution_name: meeting.institutionName,
      category: meeting.category, status: meeting.status,
      proposed_starts_at: meeting.proposedStartsAt ?? null, proposed_ends_at: meeting.proposedEndsAt ?? null,
      location: meeting.location ?? null, external_url: meeting.externalUrl?.startsWith("https://www.google.com/search?q=") ? null : meeting.externalUrl ?? null,
      startup_visible_note: meeting.startupVisibleNote ?? null, next_action: meeting.nextAction ?? null,
    };
    const existing = potentialMeetings.some((entry) => entry.id === meeting.id);
    const result = existing
      ? await supabase.from("potential_meetings").update(values).eq("id", meeting.id)
      : await supabase.from("potential_meetings").insert({ id: meeting.id, ...values, created_by: profile.id });
    if (result.error) {
      setPotentialMeetings(before);
      showToast(`Meeting could not be saved: ${result.error.message}`);
      return;
    }
    const previous = potentialMeetings.find((entry) => entry.id === meeting.id);
    const privateDetailsChanged = !previous || previous.contactName !== meeting.contactName || previous.contactEmail !== meeting.contactEmail || previous.internalNote !== meeting.internalNote;
    if (!privateDetailsChanged) { showToast("Potential Biz Meet saved"); return; }
    const { error } = await supabase.from("potential_meeting_admin_details").upsert({
      potential_meeting_id: meeting.id, contact_name: meeting.contactName ?? null,
      contact_email: meeting.contactEmail ?? null, internal_note: meeting.internalNote ?? null, updated_by: profile.id,
    }, { onConflict: "potential_meeting_id" });
    if (error) {
      setPotentialMeetings(before);
      window.dispatchEvent(new Event("programme-refresh"));
      showToast(`Meeting details could not be fully saved: ${error.message}`);
      return;
    }
    showToast("Potential Biz Meet saved");
  };
  const deletePotentialMeeting = async (meeting: PotentialMeeting) => {
    const previous = potentialMeetings;
    setPotentialMeetings((current) => current.filter((entry) => entry.id !== meeting.id));
    if (productionMode && supabase) {
      const { error } = await supabase.from("potential_meetings").delete().eq("id", meeting.id);
      if (error) {
        setPotentialMeetings(() => previous);
        showToast(`Potential Biz Meet could not be deleted: ${error.message}`);
        window.dispatchEvent(new Event("programme-refresh"));
        return;
      }
    }
    showToast("Potential Biz Meet deleted");
  };
  const savePotentialMeetingDecision = async (meeting: PotentialMeeting, decision: Decision, priorityRating?: 1 | 2 | 3) => {
    const previous = potentialMeetings.find((entry) => entry.id === meeting.id);
    const updated = { ...meeting, decision, priorityRating: priorityRating ?? meeting.priorityRating, adminReviewedAt: undefined };
    setPotentialMeetings((current) => current.map((entry) => entry.id === meeting.id ? updated : entry));
    if (productionMode && supabase) {
      const { error } = await supabase.from("potential_meeting_decisions").upsert({
        potential_meeting_id: meeting.id, decision, priority_rating: priorityRating ?? meeting.priorityRating ?? null, updated_by: profile.id, admin_reviewed_at: null, admin_reviewed_by: null,
      }, { onConflict: "potential_meeting_id" });
      if (error) {
        setPotentialMeetings((current) => current.map((entry) => entry.id === meeting.id ? previous ?? entry : entry));
        showToast(`Decision could not be saved: ${error.message}`);
        return;
      }
    }
    showToast("Decision saved");
  };
  const saveAvailabilityBlock = async (block: AvailabilityBlock) => {
    setAvailability((current) => [...current, block]);
    if (!productionMode || !supabase) {
      showToast("Company work added; LVCN can see the block");
      return;
    }
    const { error } = await supabase.from("availability_blocks").insert({
      id: block.id,
      organisation_id: block.organisationId,
      title: block.title,
      note: block.note || null,
      starts_at: block.startsAt,
      ends_at: block.endsAt,
      created_by: profile.id,
    });
    if (error) {
      setAvailability((current) => current.filter((entry) => entry.id !== block.id));
      showToast(`Company work could not be saved: ${error.message}`);
      return;
    }
    showToast("Company work added; LVCN can see the block");
  };
  const markAvailabilityReviewed = async (block: AvailabilityBlock) => {
    const reviewedAt = new Date().toISOString();
    setAvailability((current) => current.map((entry) => entry.id === block.id ? { ...entry, adminReviewedAt: reviewedAt } : entry));
    if (productionMode && supabase) {
      const { error } = await supabase.from("availability_blocks").update({ admin_reviewed_at: reviewedAt, admin_reviewed_by: profile.id }).eq("id", block.id);
      if (error) {
        setAvailability((current) => current.map((entry) => entry.id === block.id ? block : entry));
        showToast(`Availability alert could not be reviewed: ${error.message}`);
        return;
      }
    }
    showToast("Availability alert marked reviewed");
  };
  const markPotentialMeetingReviewed = async (meeting: PotentialMeeting) => {
    const reviewedAt = new Date().toISOString();
    setPotentialMeetings((current) => current.map((entry) => entry.id === meeting.id ? { ...entry, adminReviewedAt: reviewedAt } : entry));
    if (productionMode && supabase) {
      const { error } = await supabase.from("potential_meeting_decisions").update({
        admin_reviewed_at: reviewedAt, admin_reviewed_by: profile.id,
      }).eq("potential_meeting_id", meeting.id).eq("decision", meeting.decision);
      if (error) {
        setPotentialMeetings((current) => current.map((entry) => entry.id === meeting.id ? meeting : entry));
        showToast(`Inbox item could not be cleared: ${error.message}`);
        return;
      }
    }
    showToast("Admin action marked reviewed");
  };
  const markEventResponseReviewed = async (item: ScheduleItem, response: ScheduleItem["responses"][number]) => {
    const reviewedAt = new Date().toISOString();
    setItems((current) => current.map((entry) => entry.id !== item.id ? entry : { ...entry, responses: entry.responses.map((candidate) => candidate.organisationId === response.organisationId ? { ...candidate, adminReviewedAt: reviewedAt } : candidate) }));
    if (productionMode && supabase) {
      const { error } = await supabase.from("event_responses").update({ admin_reviewed_at: reviewedAt, admin_reviewed_by: profile.id }).eq("schedule_item_id", item.id).eq("organisation_id", response.organisationId);
      if (error) {
        setItems((current) => current.map((entry) => entry.id !== item.id ? entry : { ...entry, responses: entry.responses.map((candidate) => candidate.organisationId === response.organisationId ? response : candidate) }));
        showToast(`Inbox item could not be cleared: ${error.message}`);
        return;
      }
    }
    showToast("Inbox item marked reviewed");
  };
  const replyToScheduleRequest = async (
    item: ScheduleItem,
    response: ScheduleItem["responses"][number],
    body: string,
    status: AdminResponseStatus,
  ) => {
    if (!body.trim()) return;
    const now = new Date().toISOString();
    const conversationStatus = status === "needs_details" ? "awaiting_startup" : "resolved";
    const optimisticMessage = { id: crypto.randomUUID(), body: body.trim(), authorRole: "lvnc_admin" as const, createdAt: now };
    setItems((current) => current.map((entry) => entry.id !== item.id ? entry : {
      ...entry,
      responses: entry.responses.map((candidate) => candidate.organisationId !== response.organisationId ? candidate : {
        ...candidate,
        conversationStatus,
        adminResponseStatus: status,
        adminReviewedAt: now,
        messages: [...(candidate.messages ?? []), optimisticMessage],
      }),
    }));
    if (productionMode && supabase) {
      if (!response.id) {
        showToast("Reply could not be sent: refresh the schedule and try again.");
        window.dispatchEvent(new Event("programme-refresh"));
        return;
      }
      const { error: messageError } = await supabase.from("event_response_messages").insert({
        event_response_id: response.id,
        body: body.trim(),
        author_id: profile.id,
        author_role: "lvnc_admin",
      });
      const { error: responseError } = await supabase.from("event_responses").update({
        conversation_status: conversationStatus,
        admin_response_status: status,
        admin_replied_at: now,
        admin_replied_by: profile.id,
        admin_reviewed_at: now,
        admin_reviewed_by: profile.id,
      }).eq("id", response.id);
      if (messageError || responseError) {
        showToast(`Reply could not be saved: ${(messageError ?? responseError)?.message}`);
        window.dispatchEvent(new Event("programme-refresh"));
        return;
      }
    }
    showToast(status === "needs_details" ? "Question sent to startup" : "Response sent and request resolved");
  };

  const persistNewItem = async (item: ScheduleItem) => {
    if (!productionMode || !supabase) return;
    const { error } = await supabase.from("schedule_items").insert({
      id: item.id,
      ...scheduleItemValues(item),
      created_by: profile.id,
      created_organisation_id: item.createdOrganisationId ?? null,
    });
    if (error) throw error;
    if (
      item.visibilityScope === "selected_organisations" &&
      item.organisationIds.length
    ) {
      const { error: targetError } = await supabase.from("schedule_item_organisations").insert(
        item.organisationIds.map((organisationId) =>
          meetingTargetValues(item, organisationId),
        ),
      );
      if (targetError) {
        // Avoid leaving an invisible/orphaned item when its audience failed.
        await supabase.from("schedule_items").delete().eq("id", item.id);
        throw targetError;
      }
    }
  };
  function restoreHistoryItems(
    from: ScheduleItem[],
    to: ScheduleItem[],
    label: "Undo" | "Redo",
  ) {
    const client = supabase;
    if (!productionMode || !client) {
      showToast(`${label} complete`);
      return;
    }
    const restore = async () => {
      const before = new Map(from.map((item) => [item.id, item]));
      const after = new Map(to.map((item) => [item.id, item]));
      const organisationIdsMatch = (left: ScheduleItem, right: ScheduleItem) =>
        [...left.organisationIds].sort().join(",") ===
        [...right.organisationIds].sort().join(",");
      const coordinationMatches = (left: ScheduleItem, right: ScheduleItem) =>
        JSON.stringify(
          [...left.organisationIds]
            .sort()
            .map((organisationId) => meetingTargetValues(left, organisationId)),
        ) ===
        JSON.stringify(
          [...right.organisationIds]
            .sort()
            .map((organisationId) => meetingTargetValues(right, organisationId)),
        );
      const responseForCurrentOrganisation = (item: ScheduleItem) =>
        item.responses.find(
          (response) => response.organisationId === profile.organisationId,
        );

      for (const [id, item] of after) {
        const previous = before.get(id);
        if (!previous) {
          await persistNewItem(item);
          continue;
        }
        if (JSON.stringify(scheduleItemValues(previous)) !== JSON.stringify(scheduleItemValues(item))) {
          const { error } = await client
            .from("schedule_items")
            .update(scheduleItemValues(item))
            .eq("id", id);
          if (error) throw error;
        }
        if (!organisationIdsMatch(previous, item)) {
          const { error: removeError } = await client
            .from("schedule_item_organisations")
            .delete()
            .eq("schedule_item_id", id);
          if (removeError) throw removeError;
          if (item.visibilityScope === "selected_organisations" && item.organisationIds.length) {
            const { error: insertError } = await client
              .from("schedule_item_organisations")
              .insert(
                item.organisationIds.map((organisationId) =>
                  meetingTargetValues(item, organisationId),
                ),
              );
            if (insertError) throw insertError;
          }
        }
        if (organisationIdsMatch(previous, item) && !coordinationMatches(previous, item)) {
          for (const organisationId of item.organisationIds) {
            const { error } = await client
              .from("schedule_item_organisations")
              .update(meetingTargetValues(item, organisationId))
              .eq("schedule_item_id", id)
              .eq("organisation_id", organisationId);
            if (error) throw error;
          }
        }
        const oldResponse = responseForCurrentOrganisation(previous);
        const newResponse = responseForCurrentOrganisation(item);
        if (JSON.stringify(oldResponse) !== JSON.stringify(newResponse)) {
          // Members cannot delete a response under the existing RLS policy.
          // "undecided" is the faithful no-decision state and remains auditable.
          const { error } = await client.from("event_responses").upsert(
            {
              schedule_item_id: id,
              organisation_id: profile.organisationId,
              decision: newResponse?.decision ?? "undecided",
              note: newResponse?.note ?? null,
              updated_by: profile.id,
            },
            { onConflict: "schedule_item_id,organisation_id" },
          );
          if (error) throw error;
        }
      }
      for (const [id] of before) {
        if (after.has(id)) continue;
        const { error } = await client
          .from("schedule_items")
          .delete()
          .eq("id", id);
        if (error) throw error;
      }
    };
    historySyncRef.current = historySyncRef.current
      .then(restore, restore)
      .then(() => showToast(`${label} complete`))
      .catch((error: { message?: string }) => {
        showToast(`${label} could not be saved: ${error.message ?? "try refreshing"}`);
        window.dispatchEvent(new Event("programme-refresh"));
      });
  }
  const duplicateItem = async (item: ScheduleItem) => {
    const copy = {
      ...item,
      id: crypto.randomUUID(),
      title: `${item.title} (copy)`,
      status: "draft" as const,
      createdBy: profile.id,
      createdOrganisationId: undefined,
      responses: [],
    };
    try {
      await persistNewItem(copy);
    } catch (error) {
      showToast(`Copy could not be created: ${error instanceof Error ? error.message : "try again"}`);
      return;
    }
    setItemsWithHistory((current) => [...current, copy]);
    setSelectedId(copy.id);
    showToast("Draft copy created");
  };
  const deleteItem = async (item: ScheduleItem) => {
    if (productionMode && supabase) {
      // Related targets, responses and messages use ON DELETE CASCADE. Deleting
      // them manually first breaks the startup-owned proposal path because
      // participants deliberately have no direct delete permission on replies.
      const { error } = await supabase.from("schedule_items").delete().eq("id", item.id);
      if (error) {
        showToast(`Item could not be deleted: ${error.message}`);
        return;
      }
    }
    setItemsWithHistory((current) => current.filter((entry) => entry.id !== item.id));
    showToast("Item permanently deleted");
    setSelectedId(undefined);
  };
  const updateItem = async (item: ScheduleItem) => {
    const previous = items.find((entry) => entry.id === item.id);
    if (!previous) return;
    if (productionMode && supabase) {
      const { error } = await supabase
        .from("schedule_items")
        .update(scheduleItemValues(item))
        .eq("id", item.id);
      if (error) {
        showToast(`Item could not be saved: ${error.message}`);
        return;
      }
      const { error: targetDeleteError } = await supabase
        .from("schedule_item_organisations")
        .delete()
        .eq("schedule_item_id", item.id);
      if (targetDeleteError) {
        await supabase.from("schedule_items").update(scheduleItemValues(previous)).eq("id", item.id);
        showToast(`Audience could not be saved: ${targetDeleteError.message}`);
        return;
      }
      if (item.visibilityScope === "selected_organisations" && item.organisationIds.length) {
        const { error: targetInsertError } = await supabase
          .from("schedule_item_organisations")
          .insert(item.organisationIds.map((organisationId) => meetingTargetValues(item, organisationId)));
        if (targetInsertError) {
          await supabase.from("schedule_items").update(scheduleItemValues(previous)).eq("id", item.id);
          await supabase.from("schedule_item_organisations").delete().eq("schedule_item_id", item.id);
          if (previous.visibilityScope === "selected_organisations" && previous.organisationIds.length) {
            await supabase.from("schedule_item_organisations").insert(previous.organisationIds.map((organisationId) => meetingTargetValues(previous, organisationId)));
          }
          showToast(`Audience could not be saved: ${targetInsertError.message}`);
          return;
        }
      }
    }
    setItemsWithHistory((current) =>
      current.map((entry) => (entry.id === item.id ? item : entry)),
    );
    showToast("Item updated");
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const setMeetingCategoryVisible = (category: string, visible: boolean) => {
    setHiddenMeetingCategories((current) =>
      visible
        ? current.filter((value) => value !== category)
        : [...new Set([...current, category])],
    );
    if (productionMode && supabase)
      void supabase
        .from("meeting_category_visibility")
        .upsert(
          { category, visible_to_startups: visible, updated_by: profile.id },
          { onConflict: "category" },
        )
        .then(({ error }) => error && showToast(error.message));
    showToast(
      `${category} is now ${visible ? "visible to" : "hidden from"} startups`,
    );
  };
  const setSectionVisible = (sectionId: string, visible: boolean) => {
    setHiddenSections((current) =>
      visible
        ? current.filter((value) => value !== sectionId)
        : [...new Set([...current, sectionId])],
    );
    if (productionMode && supabase)
      void supabase
        .from("app_section_visibility")
        .upsert(
          { section_id: sectionId, visible_to_startups: visible, updated_by: profile.id },
          { onConflict: "section_id" },
        )
        .then(({ error }) => error && showToast(error.message));
    showToast(
      `${sectionId.replaceAll("-", " ")} is now ${visible ? "visible to" : "hidden from"} startups`,
    );
  };
  const setBusinessMeetingColumnVisible = (columnId: string, visible: boolean) => {
    setHiddenBusinessMeetingColumns((current) =>
      visible
        ? current.filter((value) => value !== columnId)
        : [...new Set([...current, columnId])],
    );
    if (productionMode && supabase)
      void supabase
        .from("business_meeting_column_visibility")
        .upsert(
          { column_id: columnId, visible_to_startups: visible, updated_by: profile.id },
          { onConflict: "column_id" },
        )
        .then(({ error }) => error && showToast(error.message));
    showToast(
      `${columnId.replaceAll("-", " ")} is now ${visible ? "visible to" : "hidden from"} startups`,
    );
  };
  const changeCalendarView = (nextView: ViewMode) => {
    setView(nextView);
    setWeek((date) =>
      nextView === "day"
        ? startOfDay(date)
        : nextView === "week"
          ? startOfWeek(date, { weekStartsOn: 1 })
          : new Date(date.getFullYear(), date.getMonth(), 1),
    );
  };
  const openCreateAt = (startsAt?: string, endsAt?: string) => {
    setCreateRange({ startsAt, endsAt });
    setCreateOpen(true);
  };
  const runExport = async (kind: "excel" | "pdf") => {
    exportCancelled.current = false;
    setExportState({ kind, progress: 5 });
    try {
      const exporters = await import("./lib/export");
      const options = {
        mode: kind === "excel" ? "spreadsheet" : "calendar",
        onProgress: (progress: number) =>
          setExportState((current) =>
            current ? { ...current, progress } : current,
          ),
        isCancelled: () => exportCancelled.current,
      } as const;
      if (kind === "excel")
        await exporters.exportExcel(visibleItems, organisations, options);
      else exporters.exportPdf(visibleItems, options);
      if (!exportCancelled.current)
        showToast(`${kind.toUpperCase()} export downloaded`);
    } catch (error) {
      if (error instanceof Error && error.message === "Export cancelled")
        showToast("Export cancelled");
      else showToast("Export failed. Please try again.");
    } finally {
      setExportState(undefined);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f4] text-slate-950">
      <Sidebar
        profile={profile}
        page={page}
        mobileOpen={mobileMenu}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((value) => !value)}
        onClose={() => setMobileMenu(false)}
        onNavigate={(nextPage) => {
          setSelectedId(undefined);
          setHighlightMeetingNote(false);
          setPage(nextPage);
        }}
        onBusy={() => setBusyOpen(true)}
        adminActionCount={potentialMeetings.filter((meeting) => meeting.decision !== "undecided" && !meeting.adminReviewedAt).length + items.flatMap((item) => item.responses).filter((response) => (response.decision !== "undecided" || response.note) && !response.adminReviewedAt).length + availability.filter((block) => !block.adminReviewedAt).length}
        language={language}
        setLanguage={setLanguage}
        hiddenSections={hiddenSections}
        onSectionVisibilityChange={setSectionVisible}
      />
      <div className={cn(sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[232px]")}>
        <Topbar
          profile={profile}
          demoMode={!productionMode}
          items={visibleItems}
          availability={availability}
          page={page}
          scheduleMode={scheduleMode}
          setScheduleMode={setScheduleMode}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          onUndo={undoItems}
          onRedo={redoItems}
          setProfile={(next) => {
            setProfile(next);
            setSelectedId(undefined);
            setScheduleMode(
              next.role === "startup_member" ? "spreadsheet" : "calendar",
            );
          }}
          onLogout={() => {
            if (productionMode && supabase) void supabase.auth.signOut();
            else {
              setProfile(profiles[0]);
              setSelectedId(undefined);
              setScheduleMode("calendar");
              showToast("Preview reset");
            }
          }}
          onMenu={() => setMobileMenu(true)}
          language={language}
        />
        <main className="mx-auto max-w-[1600px] px-4 pb-12 pt-5 sm:px-6 lg:px-8">
          {page === "organisers" ? (
            <OrganisersPage />
          ) : page === "location" ? (
            <LocationPage />
          ) : page === "hotel-recs" ? (
            <HotelRecommendationsPage language={language} />
          ) : page === "toilets" ? (
            <ToiletMapPage />
          ) : page === "external-events" ? (
            <ExternalEventsPage />
          ) : page === "business-meetings" ? (
            <BusinessMeetingsPage
              meetings={potentialMeetings}
              scheduleItems={items}
              availability={availability}
              organisationNames={organisationNames}
              hiddenColumns={hiddenBusinessMeetingColumns}
              onColumnVisibilityChange={setBusinessMeetingColumnVisible}
              isAdmin={isAdmin}
              isPartnerObserver={isPartnerObserver}
              onSave={savePotentialMeeting}
              onDelete={deletePotentialMeeting}
              onDecision={savePotentialMeetingDecision}
              onReview={markPotentialMeetingReviewed}
              language={language}
            />
          ) : page === "updates" && !isPartnerObserver ? (
            <StartupUpdatesPage updates={startupUpdates} schemaReady={updatesSchemaReady} isAdmin={isAdmin} organisationNames={organisationNames} onMarkAllRead={markStartupUpdatesRead} onSend={sendStartupUpdate} />
          ) : page === "admin-hub" && isAdmin ? (
            <AdminHubPage items={items} potentialMeetings={potentialMeetings} onOpenSchedule={() => setPage("calendar")} onOpenInbox={() => setPage("admin-inbox")} onOpenMeetings={() => setPage("business-meetings")} onOpenDecisions={() => setPage("decisions")} onOpenReport={() => setPage("admin-reporting")} onOpenUpdates={() => setPage("updates")} />
          ) : page === "admin-inbox" && isAdmin ? (
            <AdminInboxQueuePage items={items} potentialMeetings={potentialMeetings} availability={availability} organisationNames={organisationNames} onReplyEvent={replyToScheduleRequest} onResolveEvent={markEventResponseReviewed} onReviewPotential={markPotentialMeetingReviewed} onReviewAvailability={markAvailabilityReviewed} onOpenPotential={() => setPage("business-meetings")} />
          ) : page === "admin-reporting" && isAdmin ? (
            <WeeklyProgrammeRecordPage items={items} organisationNames={organisationNames} />
          ) : page === "calendar" || isPartnerObserver ? (
            <>
              <CalendarHeader
                scheduleMode={scheduleMode}
                language={language}
                week={week}
                view={view}
                setView={changeCalendarView}
                isAdmin={isAdmin}
                canCreate={!isPartnerObserver}
                search={search}
                setSearch={setSearch}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                onPrevious={() =>
                  setWeek((date) =>
                    view === "day"
                      ? nextWorkingDay(date, -1)
                      : view === "month"
                        ? addMonths(date, -1)
                        : addWeeks(date, -1),
                  )
                }
                onNext={() =>
                  setWeek((date) =>
                    view === "day"
                      ? nextWorkingDay(date, 1)
                      : view === "month"
                        ? addMonths(date, 1)
                        : addWeeks(date, 1),
                  )
                }
                onToday={() => {
                  const today = new Date();
                  setWeek(
                    view === "day" &&
                      (today.getDay() === 0 || today.getDay() === 6)
                      ? nextWorkingDay(today, 1)
                      : view === "day"
                        ? today
                        : startOfWeek(today, { weekStartsOn: 1 }),
                  );
                }}
                onCreate={() => openCreateAt()}
                onImport={() => setImportOpen(true)}
                onExport={(kind: "excel" | "pdf") => void runExport(kind)}
              />
              {(isAdmin || isPartnerObserver) && (
                <Filters
                  typeFilter={typeFilter}
                  setTypeFilter={setTypeFilter}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  organisationFilter={organisationFilter}
                  setOrganisationFilter={setOrganisationFilter}
                  observerMode={isPartnerObserver}
                />
              )}
              {scheduleMode === "calendar" ? (
                <CalendarBoard
                  week={week}
                  view={view}
                  items={visibleItems}
                  availability={visibleAvailability}
                  isAdmin={isAdmin}
                  profile={profile}
                  onSelect={setSelectedId}
                  onSelectDay={(date) => setWeek(date)}
                  onCreateAt={isPartnerObserver ? () => undefined : openCreateAt}
                />
              ) : (
                <SpreadsheetBoard
                  items={visibleItems}
                  availability={visibleAvailability}
                  isAdmin={isAdmin}
                  masterTemplate={isAdmin && organisationFilter === "all"}
                  profile={profile}
                  language={language}
                  anchorDate={week}
                  onSelectDay={(date) => setWeek(date)}
                  onSelect={setSelectedId}
                  onDecision={(item, decision) => saveDecision(item, decision)}
                />
              )}
            </>
          ) : (
            <DecisionsPage
              items={decisionItems}
              potentialMeetings={potentialMeetings}
              engagementEvents={engagementEvents}
              engagementIdentities={engagementIdentities}
              engagementInvites={engagementInvites}
              organisationNames={organisationNames}
              profile={profile}
              language={language}
              onOpenSchedule={() => {
                setPage("calendar");
                setScheduleMode("spreadsheet");
              }}
              onOpenBusinessMeetings={() => setPage("business-meetings")}
            />
          )}
        </main>
      </div>
      {selected && (
        <ItemDrawer
          item={selected}
          organisationNames={organisationNames}
          isAdmin={isAdmin}
          profile={profile}
          availability={availability}
          highlightMeetingNote={highlightMeetingNote}
          onClose={() => {
            setSelectedId(undefined);
            setHighlightMeetingNote(false);
          }}
          onDecision={updateDecision}
          onEdit={() => setEditOpen(true)}
          onDuplicate={() => duplicateItem(selected)}
          onDelete={() => deleteItem(selected)}
        />
      )}
      <CreateDialog
        open={createOpen}
        setOpen={setCreateOpen}
        isAdmin={isAdmin}
        profile={profile}
        defaultItemType={createDefaultType}
        initialStartsAt={createRange.startsAt}
        initialEndsAt={createRange.endsAt}
        onCreate={async (item) => {
          try {
            await persistNewItem(item);
          } catch (error) {
            showToast(`Item could not be created: ${error instanceof Error ? error.message : "try again"}`);
            return;
          }
          setItemsWithHistory((current) => [...current, item]);
          setSelectedId(item.id);
          if (item.startsAt) {
            const date = new Date(item.startsAt);
            setWeek(
              view === "day" ? date : startOfWeek(date, { weekStartsOn: 1 }),
            );
          }
          showToast("Item created");
        }}
      />
      {selected && (
        <CreateDialog
          open={editOpen}
          setOpen={setEditOpen}
          isAdmin={isAdmin}
          profile={profile}
          item={selected}
          onCreate={updateItem}
        />
      )}
      <BusyDialog
        open={busyOpen}
        setOpen={setBusyOpen}
        organisationId={profile.organisationId ?? organisations[0].id}
        onCreate={(block) => void saveAvailabilityBlock(block)}
      />
      <ImportDialogEnhanced
        open={importOpen}
        setOpen={setImportOpen}
        onImport={(newItems) => {
          void (async () => {
            const results = await Promise.allSettled(newItems.map((item) => persistNewItem(item)));
            const saved = newItems.filter((_, index) => results[index].status === "fulfilled");
            if (saved.length) setItemsWithHistory((current) => [...current, ...saved]);
            showToast(saved.length === newItems.length
              ? `${saved.length} items imported`
              : `${saved.length} of ${newItems.length} items imported; failed rows were not added`);
          })();
        }}
      />
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-xl">
          <Check className="size-4 text-emerald-400" />
          {toast}
        </div>
      )}
      {exportState && (
        <div className="fixed bottom-5 right-5 z-[80] w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-800">
            <span>Preparing {exportState.kind.toUpperCase()}…</span>
            <span>{exportState.progress}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#162c5b] transition-all"
              style={{ width: `${exportState.progress}%` }}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              exportCancelled.current = true;
            }}
            className="mt-3 text-xs font-semibold text-slate-500 underline hover:text-slate-900"
          >
            Cancel export
          </button>
        </div>
      )}
    </div>
  );
}

function Sidebar({
  profile,
  language,
  setLanguage,
  page,
  mobileOpen,
  collapsed,
  onToggle,
  onClose,
  onNavigate,
  onBusy,
  adminActionCount,
  hiddenSections,
  onSectionVisibilityChange,
}: {
  profile: Profile;
  language: Language;
  setLanguage: (language: Language) => void;
  page: string;
  mobileOpen: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onClose: () => void;
  onNavigate: (
    page:
      | "calendar"
      | "business-meetings"
      | "admin-hub"
      | "admin-inbox"
      | "admin-reporting"
      | "updates"
      | "decisions"
      | "organisers"
      | "location"
      | "hotel-recs"
      | "toilets"
      | "external-events",
  ) => void;
  onBusy: () => void;
  adminActionCount: number;
  hiddenSections: string[];
  onSectionVisibilityChange: (sectionId: string, visible: boolean) => void;
}) {
  const copy = language === "ko" ? koreanUiText : uiText.en;
  const businessCopy =
    language === "ko"
      ? {
          breadcrumb: "일정 / 잠재 비즈니스 미팅",
          institution: "기관",
          category: "분류",
          decision: "결정",
          status: "상태",
          person: "담당자",
          time: "시간",
          note: "메모 보기",
          pending: "검토 대기",
          confirm: "확인",
          reject: "거절",
          noMeetings: "현재 표시할 잠재 비즈니스 미팅이 없습니다.",
        }
      : {
          breadcrumb: "Schedule / Business meetings",
          institution: "Institution",
          category: "Category",
          decision: "Decision",
          status: "Status",
          person: "Person",
          time: "Time",
          note: "Read note",
          pending: "Pending",
          confirm: "Confirm",
          reject: "Reject",
          noMeetings: "No business meetings are currently visible.",
        };
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [programmeToolsOpen, setProgrammeToolsOpen] = useState(false);
  void businessCopy;
  const nav = profile.role === "lvnc_admin" ? [
    { id: "admin-hub", label: "Admin Hub", icon: LayoutList },
    { id: "admin-reporting", label: "Programme Record", icon: Printer },
    { id: "calendar", label: copy.schedule, icon: CalendarDays },
    { id: "business-meetings", label: copy.businessMeetings, icon: Building2 },
    {
      id: "decisions",
      label: copy.cohortDecisions,
      icon: LayoutList,
    },
    { id: "admin-inbox", label: "Action Inbox", icon: AlertTriangle },
    { id: "updates", label: "Startup Updates", icon: Bell },
  ] : profile.role === "partner_observer" ? [
    { id: "calendar", label: copy.schedule, icon: CalendarDays },
    { id: "business-meetings", label: copy.businessMeetings, icon: Building2 },
    { id: "location", label: copy.venueLocation, icon: MapPin },
    { id: "hotel-recs", label: copy.hotelRecs, icon: Building2 },
    { id: "toilets", label: copy.toiletMap, icon: Toilet },
    { id: "external-events", label: copy.externalLinks, icon: Link2 },
  ] : [
    { id: "calendar", label: copy.schedule, icon: CalendarDays },
    { id: "business-meetings", label: copy.businessMeetings, icon: Building2 },
    { id: "decisions", label: copy.myDecisions, icon: LayoutList },
    { id: "updates", label: "Updates", icon: Bell },
    { id: "location", label: copy.venueLocation, icon: MapPin },
    { id: "hotel-recs", label: copy.hotelRecs, icon: Building2 },
    { id: "toilets", label: copy.toiletMap, icon: Toilet },
    { id: "external-events", label: copy.externalLinks, icon: Link2 },
  ];
  return (
    <Fragment>
      {mobileOpen && (
        <button
          className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden"
          onClick={onClose}
          aria-label="Close navigation"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[232px] flex-col overflow-y-auto overscroll-contain border-r border-slate-200 bg-[#fbfbf9] px-4 py-5 transition-[width,padding,transform] duration-200 lg:translate-x-0",
          collapsed && "lg:w-[72px] lg:px-2",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div
          className={cn(
            "mb-5 flex items-center justify-between px-2",
            collapsed && "lg:justify-center",
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/lvcn_logo.webp"
              alt="LVCN"
              className="size-9 shrink-0 rounded-xl object-contain"
            />
            {!collapsed && (
              <div>
                <p className="text-sm font-bold tracking-tight">LVCN</p>
                <p className="text-[11px] font-medium text-slate-500">
                  Programme board
                </p>
              </div>
            )}
          </div>
          <button
            className="lg:hidden"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        </div>
        <button
          className={cn(
            "mb-3 flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50",
            collapsed && "lg:justify-center lg:px-2",
          )}
          onClick={onToggle}
          aria-label={collapsed ? copy.expand : copy.collapse}
          title={collapsed ? copy.expand : copy.collapse}
        >
          {collapsed ? (
            <ChevronsRight className="size-[18px]" />
          ) : (
            <ChevronsLeft className="size-[18px]" />
          )}
          <span className={cn(collapsed && "lg:hidden")}>
            {collapsed ? copy.expand : copy.collapse}
          </span>
        </button>
        <nav className="space-y-1">
          {nav
            .filter(
              ({ id }) =>
                profile.role === "lvnc_admin" || !hiddenSections.includes(id),
            )
            .map(({ id, label, icon: Icon }) => {
              return (
              <div key={id} className="group flex items-center gap-1">
                <button
              onClick={() => {
                onNavigate(
                  id as
                    | "calendar"
                    | "business-meetings"
      | "admin-hub"
                    | "admin-inbox"
                    | "admin-reporting"
                    | "updates"
                    | "decisions"
                    | "organisers"
                    | "location"
                    | "hotel-recs"
                    | "toilets"
                    | "external-events",
                );
                onClose();
              }}
              title={collapsed ? label : undefined}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                collapsed && "lg:justify-center lg:px-2",
                page === id
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              <span className={cn(collapsed && "lg:hidden")}>{label}</span>
              {id === "admin-inbox" && adminActionCount > 0 && <span className="ml-auto rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-black text-slate-950">{adminActionCount}</span>}
            </button>
              </div>
            );
            })}
          {profile.role === "startup_member" && (
            <button
              onClick={() => {
                onBusy();
                onClose();
              }}
              title={collapsed ? copy.addCompanyWork : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                collapsed && "lg:justify-center lg:px-2",
              )}
            >
              <Plus className="size-[18px] shrink-0" />
              <span className={cn(collapsed && "lg:hidden")}>
                {copy.addCompanyWork}
              </span>
            </button>
          )}
        </nav>
        {profile.role === "lvnc_admin" && <details open={programmeToolsOpen} onToggle={(event) => setProgrammeToolsOpen((event.currentTarget as HTMLDetailsElement).open)} className={cn("mt-4 border-t border-slate-200 pt-3", collapsed && "hidden")}><summary className="cursor-pointer list-none rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100"><span className="flex items-center justify-between">Programme tools <ChevronDown className={cn("size-4 transition-transform", programmeToolsOpen && "rotate-180")} /></span></summary><div className="mt-1 space-y-1"><p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">Shared with startups</p>{[{ id: "location", label: copy.venueLocation, icon: MapPin }, { id: "hotel-recs", label: copy.hotelRecs, icon: Building2 }, { id: "toilets", label: copy.toiletMap, icon: Toilet }, { id: "external-events", label: copy.externalLinks, icon: Link2 }].map((tool) => { const visible = !hiddenSections.includes(tool.id); const ToolIcon = tool.icon; return <div key={tool.id} className="flex items-center gap-1"><button type="button" onClick={() => { onNavigate(tool.id as "location" | "hotel-recs" | "toilets" | "external-events"); onClose(); }} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-600 hover:bg-slate-100"><ToolIcon className="size-4" />{tool.label}</button><button type="button" onClick={() => onSectionVisibilityChange(tool.id, !visible)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" title={visible ? "Visible to startups" : "Hidden from startups"} aria-label={`${visible ? "Hide" : "Show"} ${tool.label} for startups`}>{visible ? <Eye className="size-4 text-emerald-600" /> : <EyeOff className="size-4 text-slate-400" />}</button></div>; })}<p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">Admin utilities</p><button type="button" onClick={() => { onNavigate("organisers"); onClose(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-600 hover:bg-slate-100"><Link2 className="size-4" />{copy.organisers}</button><a href="https://luma.com/koreavc" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"><ExternalLink className="size-4" />{copy.investorShowcase}</a><button type="button" onClick={() => setTutorialOpen(true)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-600 hover:bg-slate-100"><CircleHelp className="size-4" />{copy.tutorial}</button><button type="button" onClick={() => setLanguage(language === "en" ? "ko" : "en")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-600 hover:bg-slate-100"><Languages className="size-4" />{language === "en" ? "Korean" : "English"}</button></div></details>}
        {profile.role !== "lvnc_admin" && <>
        <button
          onClick={() => {
            onNavigate("organisers");
            onClose();
          }}
          title={collapsed ? copy.organisers : undefined}
          className={cn(
            "mt-auto flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold",
            collapsed && "lg:justify-center lg:px-2",
            page === "organisers"
              ? "bg-slate-950 text-white"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
          )}
        >
          <Link2 className="size-[18px] shrink-0" />
          <span className={cn(collapsed && "lg:hidden")}>
            {copy.organisers}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setTutorialOpen(true)}
          title={collapsed ? copy.tutorial : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950",
            collapsed && "lg:justify-center lg:px-2",
          )}
        >
          <CircleHelp className="size-[18px] shrink-0" />
          <span className={cn(collapsed && "lg:hidden")}>{copy.tutorial}</span>
        </button>
        <button
          type="button"
          onClick={() => setLanguage(language === "en" ? "ko" : "en")}
          title={collapsed ? copy.language : undefined}
          aria-label={`Switch language to ${copy.language}`}
          className={cn(
            "mt-2 flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950",
            collapsed && "lg:justify-center lg:px-2",
          )}
        >
          <Languages className="size-[18px] shrink-0" />
          <span className={cn(collapsed && "lg:hidden")}>
            {language === "en" ? "한국어" : "English"}
          </span>
        </button>
        </>}
        <TutorialDialog open={tutorialOpen} setOpen={setTutorialOpen} language={language} />
      </aside>
    </Fragment>
  );
}

function TutorialDialog({
  open,
  setOpen,
  language,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  language: Language;
}) {
  const [selectedStep, setSelectedStep] = useState<number>();
  const tutorialImages = ["df1.png", "df2.png", "df3.png", "df5.png"];
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setSelectedStep(undefined);
      }}
    >
      <DialogContent className={selectedStep ? "max-w-[96vw] p-4" : "max-w-4xl"}>
        {selectedStep ? (
          <>
            <div className="flex items-center justify-between gap-4 pr-10">
              <button
                type="button"
                onClick={() => setSelectedStep(undefined)}
                className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
              >
                ← {language === "ko" ? "전체 안내" : "All tutorials"}
              </button>
              <p className="text-xs font-bold text-slate-500">
                {language === "ko" ? `안내 ${selectedStep} / ${tutorialImages.length}` : `Tutorial ${selectedStep} of ${tutorialImages.length}`}
              </p>
            </div>
            <img
              src={`/tutorial/${tutorialImages[selectedStep - 1]}`}
              alt={`Tutorial step ${selectedStep}`}
              className="mt-4 max-h-[78vh] w-full rounded-xl border border-slate-200 bg-white object-contain"
            />
            <div className="mt-3 flex justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                disabled={selectedStep === 1}
                onClick={() => setSelectedStep((step) => (step ? step - 1 : step))}
              >
                {language === "ko" ? "이전" : "Previous"}
              </Button>
              <Button
                type="button"
                variant="indigo"
                disabled={selectedStep === tutorialImages.length}
                onClick={() => setSelectedStep((step) => (step ? step + 1 : step))}
              >
                {language === "ko" ? "다음" : "Next"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogTitle>{language === "ko" ? "프로그램 보드 사용 방법" : "How to use the programme board"}</DialogTitle>
            <DialogDescription>
              {language === "ko"
                ? "앱을 사용하는 네 가지 방법입니다. 이미지를 선택하면 크게 볼 수 있습니다."
                : "Four quick ways to interact with the app. Select an image to focus and zoom in."}
            </DialogDescription>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {tutorialImages.map((image, index) => {
                const step = index + 1;
                return (
                <button
                  key={step}
                  type="button"
                  onClick={() => setSelectedStep(step)}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-left hover:border-indigo-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <img
                    src={`/tutorial/${image}`}
                    alt={`Open tutorial step ${step}`}
                    className="block min-h-32 w-full bg-white object-contain transition duration-200 group-hover:scale-[1.02]"
                  />
                  <span className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-600">
                    {language === "ko" ? `안내 ${step} / ${tutorialImages.length}` : `Tutorial ${step} of ${tutorialImages.length}`}
                    <Maximize2 className="size-3.5" />
                  </span>
                </button>
                );
              })}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

type HotelRecommendation = {
  name: string;
  address: string;
  typicalNightlyRate: string;
  note: string;
  bookingUrl: string;
};

type HotelSearchTool = {
  name: string;
  description: string;
  bestFor: string;
  url: string;
  tone: string;
};

const hotelSearchTools: HotelSearchTool[] = [
  { name: "Google Hotels", description: "Map-first comparison across hotel sites, with flexible-date and price-history views.", bestFor: "Start with a quick market view", url: "https://www.google.com/travel/hotels", tone: "border-blue-200 bg-blue-50/70 text-blue-950" },
  { name: "KAYAK Hotels", description: "Compare offers across travel sites, including rate types, cancellation terms and nearby areas.", bestFor: "Cross-check a shortlisted stay", url: "https://www.kayak.co.uk/hotels", tone: "border-orange-200 bg-orange-50/70 text-orange-950" },
  { name: "Skyscanner Hotels", description: "A familiar comparison experience for travellers already using Skyscanner for flights.", bestFor: "Plan flights and hotel together", url: "https://www.skyscanner.net/hotels", tone: "border-sky-200 bg-sky-50/70 text-sky-950" },
  { name: "Booking.com", description: "Useful for flexible cancellation, detailed guest reviews and practical amenity filters.", bestFor: "Book a refundable rate", url: "https://www.booking.com/", tone: "border-indigo-200 bg-indigo-50/70 text-indigo-950" },
];

const hotelRecommendations: Record<
  "Hammersmith" | "Cambridge" | "Oxford" | "Birmingham",
  { subtitle: string; hotels: HotelRecommendation[] }
> = {
  Hammersmith: {
    subtitle: "Best for the Foundry and west-London programme days.",
    hotels: [
      { name: "Premier Inn London Hammersmith", address: "255 King Street, London W6 9LU", typicalNightlyRate: "~£120", note: "Reliable value option close to Hammersmith Broadway.", bookingUrl: "https://www.premierinn.com/gb/en/hotels/england/greater-london/london/london-hammersmith-talgarth-road.html" },
      { name: "Novotel London West", address: "1 Shortlands, London W6 8DR", typicalNightlyRate: "~£180", note: "Large business hotel, a short walk from the programme base.", bookingUrl: "https://all.accor.com/hotel/0737/index.en.shtml" },
      { name: "Holiday Inn Express London – Hammersmith", address: "124 King Street, London W6 0QU", typicalNightlyRate: "~£150", note: "Straightforward breakfast-included stay near the Tube.", bookingUrl: "https://www.ihg.com/holidayinnexpress/hotels/gb/en/london/lonhm/hoteldetail" },
      { name: "St Paul's Hotel", address: "153 Hammersmith Road, London W14 0QL", typicalNightlyRate: "~£190", note: "Boutique option near Olympia and Brook Green.", bookingUrl: "https://www.stpaulshotel.co.uk/" },
      { name: "Hilton London Olympia", address: "380 Kensington High Street, London W14 8NL", typicalNightlyRate: "~£170", note: "Convenient for Olympia events and a short Tube ride to Hammersmith.", bookingUrl: "https://www.hilton.com/en/hotels/lonolhi-hilton-london-olympia/" },
      { name: "K West Hotel & Spa", address: "Richmond Way, London W14 0AX", typicalNightlyRate: "~£200", note: "Comfortable West London option near Shepherd’s Bush and the Central line.", bookingUrl: "https://www.k-west.co.uk/" },
    ],
  },
  Cambridge: {
    subtitle: "Useful for university, science-park and investor visits.",
    hotels: [
      { name: "ibis Cambridge Central Station", address: "2 Station Square, Cambridge CB1 2GA", typicalNightlyRate: "~£125", note: "Practical base directly beside Cambridge station.", bookingUrl: "https://all.accor.com/hotel/A0I9/index.en.shtml" },
      { name: "Clayton Hotel Cambridge", address: "Station Road, Cambridge CB1 2FB", typicalNightlyRate: "~£175", note: "Modern business hotel opposite the station.", bookingUrl: "https://www.claytonhotelcambridge.com/" },
      { name: "Hilton Cambridge City Centre", address: "20 Downing Street, Cambridge CB2 3DT", typicalNightlyRate: "~£190", note: "Central choice for colleges, meetings and evening dining.", bookingUrl: "https://www.hilton.com/en/hotels/camchhi-hilton-cambridge-city-centre/" },
      { name: "University Arms", address: "Regent Street, Cambridge CB2 1AD", typicalNightlyRate: "~£240", note: "Premium city-centre stay overlooking Parker's Piece.", bookingUrl: "https://www.marriott.com/en-gb/hotels/cbgak-university-arms-hotel-autograph-collection/overview/" },
    ],
  },
  Oxford: {
    subtitle: "Convenient for university, research and Oxfordshire meetings.",
    hotels: [
      { name: "Courtyard by Marriott Oxford City Centre", address: "15 Paradise Street, Oxford OX1 1LD", typicalNightlyRate: "~£190", note: "Central, modern option close to Oxford station and Westgate.", bookingUrl: "https://www.marriott.com/en-gb/hotels/oxfcy-courtyard-oxford-city-centre/overview/" },
      { name: "Malmaison Oxford", address: "3 Oxford Castle, Oxford OX1 1AY", typicalNightlyRate: "~£210", note: "Characterful central hotel in the historic castle quarter.", bookingUrl: "https://www.malmaison.com/locations/oxford/" },
      { name: "voco Oxford Spires", address: "Abingdon Road, Oxford OX1 4PS", typicalNightlyRate: "~£175", note: "Quieter riverside option with parking access.", bookingUrl: "https://www.ihg.com/voco/hotels/gb/en/oxford/oxfss/hoteldetail" },
      { name: "The Randolph Hotel", address: "Beaumont Street, Oxford OX1 2LN", typicalNightlyRate: "~£300", note: "Premium stay opposite the Ashmolean Museum.", bookingUrl: "https://www.therandolphhotel.com/" },
    ],
  },
  Birmingham: {
    subtitle: "City-centre options for Birmingham Tech Week and related events.",
    hotels: [
      { name: "Aloft Birmingham Eastside", address: "4 Woodcock Street, Birmingham B7 4BL", typicalNightlyRate: "~£120", note: "Contemporary hotel near Digbeth, Bullring and Eastside venues.", bookingUrl: "https://www.marriott.com/en-gb/hotels/bhxal-aloft-birmingham-eastside/overview/" },
      { name: "Clayton Hotel Birmingham", address: "85 Albert Street, Birmingham B5 5JE", typicalNightlyRate: "~£135", note: "Business-friendly city-centre option by the Bullring.", bookingUrl: "https://www.claytonhotelbirmingham.com/" },
      { name: "AC Hotel Birmingham", address: "160 Wharfside Street, The Mailbox, Birmingham B1 1RL", typicalNightlyRate: "~£150", note: "Canalside stay at the Mailbox, close to New Street station.", bookingUrl: "https://www.marriott.com/en-gb/hotels/bhxac-ac-hotel-birmingham/overview/" },
      { name: "Holiday Inn Birmingham City Centre", address: "Smallbrook Queensway, Birmingham B5 4EW", typicalNightlyRate: "~£115", note: "Central and convenient for rail arrivals and conference travel.", bookingUrl: "https://www.ihg.com/holidayinn/hotels/gb/en/birmingham/bhxct/hoteldetail" },
    ],
  },
};

function HotelRecommendationsPage({ language }: { language: Language }) {
  const locations = Object.keys(hotelRecommendations) as Array<keyof typeof hotelRecommendations>;
  const [location, setLocation] = useState<keyof typeof hotelRecommendations>("Hammersmith");
  const guide = hotelRecommendations[location];
  const hotelCopy = language === "ko"
    ? { eyebrow: "여행 계획", title: "호텔 추천 및 실시간 가격 비교", intro: "먼저 실시간 요금을 비교한 다음, 일정과 이동 동선에 맞는 숙소를 선택하세요.", deal: "현재 최적 요금 찾기", dealTitle: "비교 사이트에서 실시간 가격을 확인하고, 이 페이지에서 위치를 비교하세요.", dealBody: "호텔 가격은 날짜, 수요와 취소 조건에 따라 달라집니다. 예약 전에 여러 사이트의 총액을 확인하세요.", tools: "가격 비교 사이트", toolsTitle: "예약 전에 실시간 요금 확인", toolsBody: "새 탭에서 비교 사이트를 열어 확인하세요.", shortlists: "프로그램 장소별 추천", shortlistsTitle: "업무 장소와 가까운 숙소", rooms: "객실 확인", directions: "길찾기" }
    : { eyebrow: "Travel planning", title: "Hotel stays, priced with context", intro: "Compare live rates first, then choose a stay that works for your meetings, route and cancellation needs.", deal: "Find the best current deal", dealTitle: "Use comparison tools for the live price. Use this page for the right location.", dealBody: "Hotel prices shift by date, demand and cancellation terms. Check the total across more than one site before booking.", tools: "Comparison tools", toolsTitle: "Check live rates before you book", toolsBody: "Open a tool in a new tab to compare.", shortlists: "Programme shortlists", shortlistsTitle: "Stay close to where the work is", rooms: "Check rooms", directions: "Directions" };
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[.15em] text-indigo-600">{hotelCopy.eyebrow}</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">{hotelCopy.title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
        {hotelCopy.intro.length === 0 && language === "ko"
          ? "방문 가능성이 있는 지역별 소규모 추천 목록입니다. 평균 요금은 객실 1개당 1박 기준의 참고 가격이므로, 실제 날짜의 요금은 예약 링크에서 확인하세요."
          : hotelCopy.intro}
      </p>
      <section className="mt-8">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.15em] text-slate-500">{hotelCopy.tools}</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">{hotelCopy.toolsTitle}</h2>
          </div>
          <p className="text-xs text-slate-500">{hotelCopy.toolsBody}</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {hotelSearchTools.map((tool) => (
            <a key={tool.name} href={tool.url} target="_blank" rel="noreferrer" className={cn("group rounded-2xl border p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md", tool.tone)}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold">{tool.name}</h3>
                <ExternalLink className="size-4 shrink-0 opacity-70 transition group-hover:opacity-100" />
              </div>
              <p className="mt-3 text-sm leading-5 opacity-80">{tool.description}</p>
              <p className="mt-4 text-xs font-bold">{tool.bestFor}</p>
            </a>
          ))}
        </div>
      </section>
      <div className="mt-10 border-t border-slate-200 pt-8">
        <p className="text-xs font-bold uppercase tracking-[.15em] text-indigo-600">{hotelCopy.shortlists}</p>
        <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{hotelCopy.shortlistsTitle}</h2>
          <p className="text-sm text-slate-500">{guide.subtitle}</p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {locations.map((entry) => (
          <button key={entry} type="button" onClick={() => setLocation(entry)} className={cn("rounded-full px-4 py-2 text-sm font-bold transition", location === entry ? "bg-[#162c5b] text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}>
            {entry}
          </button>
        ))}
      </div>
      <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-5 py-4 text-sm text-indigo-900">
        <span className="font-bold">{location}:</span> {guide.subtitle}
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {guide.hotels.map((hotel) => {
          const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hotel.name}, ${hotel.address}`)}`;
          return (
            <article key={hotel.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.03)]">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-950">{hotel.name}</h2>
                <span className="shrink-0 text-sm font-bold text-emerald-700">{hotel.typicalNightlyRate}<span className="block text-[10px] font-medium text-slate-500">{language === "ko" ? "/ 1박" : "/ night"}</span></span>
              </div>
              <p className="mt-2 flex gap-1.5 text-sm text-slate-600"><MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" />{hotel.address}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{hotel.note}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={hotel.bookingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-[#162c5b] px-3 py-2 text-xs font-bold text-white hover:bg-[#223d78]">{language === "ko" ? "객실 확인" : "Check rooms"} <ExternalLink className="size-3.5" /></a>
                <a href={directionsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">{language === "ko" ? "길찾기" : "Directions"} <MapPin className="size-3.5" /></a>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Topbar({
  profile,
  language,
  demoMode,
  items,
  availability,
  page,
  scheduleMode,
  setScheduleMode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  setProfile,
  onLogout,
  onMenu,
}: {
  profile: Profile;
  language: Language;
  demoMode: boolean;
  items: ScheduleItem[];
  availability: AvailabilityBlock[];
  page: string;
  scheduleMode: "calendar" | "spreadsheet";
  setScheduleMode: (mode: "calendar" | "spreadsheet") => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  setProfile: (profile: Profile) => void;
  onLogout: () => void;
  onMenu: () => void;
}) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const copy = language === "ko" ? koreanUiText : uiText.en;
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/90 bg-[#f7f7f4]/90 px-4 backdrop-blur sm:px-6 lg:px-8">
      <button
        className="rounded-lg p-2 hover:bg-white lg:hidden"
        onClick={onMenu}
      >
        <Menu className="size-5" />
      </button>
      <div className="hidden min-w-0 flex-1 lg:block">
        <div className="flex items-center gap-5">
          {profile.role === "lvnc_admin" ? (
            <Pulse items={items} availability={availability} profile={profile} />
          ) : (
            <p className="text-xs font-medium text-slate-500">
              {copy.programmeSchedule}
            </p>
          )}
          {page === "calendar" && (
            <div className="flex items-center gap-3">
              <ScheduleModeToggle
                mode={scheduleMode}
                setMode={setScheduleMode}
                language={language}
              />
              <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                <button
                  type="button"
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {copy.undo}
                </button>
                <button
                  type="button"
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {copy.redo}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold">{profile.fullName}</p>
          <p className="text-[11px] text-slate-500">
            {profile.role === "lvnc_admin"
              ? "LVCN administrator"
              : organisations.find((o) => o.id === profile.organisationId)
                  ?.name}
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setProfileMenuOpen((open) => !open)}
            aria-expanded={profileMenuOpen}
            aria-label="Open account menu"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-2 shadow-sm hover:bg-slate-50"
          >
            <div
              className={cn(
                "grid size-8 place-items-center rounded-lg text-xs font-bold text-white",
                profile.role === "lvnc_admin" ? "bg-slate-900" : "bg-[#162c5b]",
              )}
            >
              {profile.fullName
                .split(" ")
                .map((part) => part[0])
                .join("")}
            </div>
            <ChevronDown className="size-4 text-slate-400" />
          </button>
          {profileMenuOpen && (
            <div className="absolute right-0 top-12 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              {demoMode && (
                <>
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Preview as
                  </p>
                  {profiles.map((candidate) => (
                    <button
                      key={candidate.id}
                      onClick={() => {
                        setProfile(candidate);
                        setProfileMenuOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50",
                        candidate.id === profile.id && "bg-indigo-50",
                      )}
                    >
                      <div className="grid size-8 place-items-center rounded-lg bg-slate-100 text-xs font-bold">
                        {candidate.fullName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {candidate.fullName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {candidate.role === "lvnc_admin"
                            ? "Admin"
                            : "Seoul Labs member"}
                        </p>
                      </div>
                    </button>
                  ))}
                </>
              )}
              <div
                className={cn(
                  "mt-1 border-t border-slate-100 pt-1",
                  !demoMode && "mt-0 border-t-0 pt-0",
                )}
              >
                <button
                  onClick={onLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50"
                >
                  <LogOut className="size-4" />
                  {demoMode ? "Reset preview" : "Log out"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function ScheduleModeToggle({
  mode,
  setMode,
  language,
}: {
  mode: "calendar" | "spreadsheet";
  setMode: (mode: "calendar" | "spreadsheet") => void;
  language: Language;
}) {
  const copy = language === "ko" ? koreanUiText : uiText.en;
  return (
    <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
      {(
        [
          ["calendar", copy.calendar],
          ["spreadsheet", copy.spreadsheet],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => setMode(value)}
          aria-pressed={mode === value}
          className={cn(
            "rounded-md px-2.5 py-1.5 text-[11px] font-bold",
            mode === value
              ? "bg-slate-950 text-white"
              : "text-slate-500 hover:text-slate-900",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Pulse({
  items,
  profile,
}: {
  items: ScheduleItem[];
  availability: AvailabilityBlock[];
  profile: Profile;
}) {
  const scopedItems = items.filter((item) => item.itemType !== "business_meeting" && item.startsAt && item.endsAt && (profile.role === "lvnc_admin" || item.visibilityScope === "cohort" || item.organisationIds.includes(profile.organisationId ?? "")));
  const overlappingScheduleEntries = scopedItems.reduce((count, item, index) => count + scopedItems.slice(index + 1).filter((other) => overlaps(item.startsAt!, item.endsAt!, other.startsAt!, other.endsAt!)).length, 0);
  const metrics = [
    {
      label: "Confirmed programme events",
      value: items.filter((i) => i.itemType === "lvnc_core" && i.status === "confirmed").length,
      color: "text-indigo-700",
      description: "Confirmed core programme events in the current view.",
    },
    {
      label: "Event records to verify",
      value: items.filter((i) => ["to_register", "details_to_verify", "approval_required", "to_arrange"].includes(i.bookingStatus)).length,
      color: "text-amber-700",
      description: "Cohort-wide schedule records still marked for registration, checking, approval or arrangement.",
    },
    {
      label: "Startup decisions waiting",
      value: items.reduce((sum, i) => sum + i.responses.filter((r) => r.decision === "undecided").length, 0),
      color: "text-slate-900",
      description: "Startup event responses still set to Pending/undecided.",
    },
    {
      label: "Overlapping schedule entries",
      value: overlappingScheduleEntries,
      color: "text-rose-700",
      description: "Pairs of timed schedule entries that overlap; this is separate from a startup's declared availability.",
    },
  ];
  return (
    <section className="flex min-w-0 items-center gap-4 xl:gap-6">
      {metrics.map((metric) => (
        <div className="flex min-w-0 items-center gap-1.5" key={metric.label} title={metric.description}>
          <span className={cn("text-sm font-bold leading-none", metric.color)}>
            {metric.value}
          </span>
          <span className="truncate text-[10px] font-medium text-slate-500">
            {metric.label}
          </span>
        </div>
      ))}
    </section>
  );
}

function CalendarHeader({
  scheduleMode,
  language,
  week,
  view,
  setView,
  isAdmin,
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  onPrevious,
  onNext,
  onToday,
  onCreate,
  canCreate = true,
  onExport,
}: any) {
  const [exportOpen, setExportOpen] = useState(false);
  const copy = language === "ko" ? koreanUiText : uiText.en;
  return (
    <div className="mb-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[190px]">
          <h1 className="text-2xl font-semibold tracking-[-.025em] sm:text-3xl">
            {scheduleMode === "calendar"
              ? format(week, "MMMM yyyy")
              : copy.spreadsheet}
          </h1>
          {scheduleMode === "calendar" && (
            <p className="mt-1 text-sm text-slate-500">
              {format(startOfWeek(week, { weekStartsOn: 1 }), "d MMM")} –{" "}
              {format(endOfWeek(week, { weekStartsOn: 1 }), "d MMM yyyy")}
            </p>
          )}
          {scheduleMode === "spreadsheet" && (
            <p className="mt-1 text-sm text-slate-500">
              Focused on {format(week, "EEEE, d MMMM yyyy")}
            </p>
          )}
        </div>
        <div className="relative min-w-52 flex-1">
          <Search className="absolute left-3 top-3 size-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={copy.searchSchedule}
            className="pl-9"
          />
        </div>
        {canCreate && <Button variant="indigo" onClick={onCreate}>
          <Plus className="size-4" />
          {isAdmin ? copy.createItem : copy.proposeEvent}
        </Button>}
        {scheduleMode === "calendar" && (
          <Button
            variant="secondary"
            onClick={() => void document.documentElement.requestFullscreen?.()}
          >
            <Maximize2 className="size-4" />
            {language === "ko" ? "캘린더 집중 모드" : "Focus Calendar Mode"}
          </Button>
        )}
        <div className="relative">
          <Button
            variant="secondary"
            onClick={() => setExportOpen((open) => !open)}
            aria-expanded={exportOpen}
          >
            <Download className="size-4" />
            {copy.export}
            <ChevronDown className="size-3.5" />
          </Button>
          {exportOpen && (
            <div className="absolute right-0 top-11 z-20 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"><p className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[.1em] text-slate-400">Choose export format</p>
              <button
                onClick={() => {
                  setExportOpen(false);
                  onExport("excel");
                }}
                className="flex w-full gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
              >
                <FileDown className="size-4" />
                {language === "ko" ? "일정 스프레드시트" : "Schedule spreadsheet"}
              </button>
              <button
                onClick={() => {
                  setExportOpen(false);
                  onExport("pdf");
                }}
                className="flex w-full gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
              >
                <Printer className="size-4" />
                {language === "ko" ? "캘린더 PDF" : "Calendar PDF"}
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <CalendarKey
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          scheduleMode={scheduleMode}
          language={language}
          isAdmin={isAdmin}
        />
        <div className="flex flex-wrap items-center gap-2">
          {scheduleMode === "calendar" && (
            <Button variant="secondary" onClick={onToday}>
              {copy.jumpToday}
            </Button>
          )}
          {scheduleMode === "calendar" && (
            <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white">
              <button
                onClick={onPrevious}
                className="p-2.5 hover:bg-slate-50"
                aria-label="Previous period"
              >
                <ArrowLeft className="size-4" />
              </button>
              <button
                onClick={onNext}
                className="border-l border-slate-200 p-2.5 hover:bg-slate-50"
                aria-label="Next period"
              >
                <ArrowRight className="size-4" />
              </button>
            </div>
          )}
          {scheduleMode === "calendar" && (
            <div className="flex rounded-lg border border-slate-200 bg-white p-1">
              {(["day", "week", "month"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setView(mode)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-bold capitalize",
                    view === mode
                      ? "bg-slate-950 text-white"
                      : "text-slate-500",
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CalendarKey({
  typeFilter,
  setTypeFilter,
  scheduleMode,
  language,
  isAdmin,
}: {
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  scheduleMode: "calendar" | "spreadsheet";
  language: Language;
  isAdmin: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 text-[10px] font-semibold text-slate-500">
      <span className="font-bold uppercase tracking-[.12em] text-slate-400">
        {isAdmin && scheduleMode === "spreadsheet"
          ? language === "ko"
            ? "필터"
            : "Filter"
          : "Key"}
      </span>
      {scheduleMode === "calendar" && (
        <>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-sm border border-emerald-300 bg-emerald-50" />
            Confirmed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-sm border border-dashed border-amber-400 bg-amber-50" />
            Decision pending
          </span>
        </>
      )}
      {isAdmin && <button type="button" onClick={() => setTypeFilter("all")} aria-pressed={typeFilter === "all"} className={cn("rounded-md px-2 py-0.5 transition", typeFilter === "all" ? "bg-slate-200 text-slate-900" : "hover:bg-slate-100")}>All types</button>}
      {Object.entries(itemMeta).map(([type, meta]) => isAdmin ? (
        <button
          key={type}
          type="button"
          onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}
          aria-pressed={typeFilter === type}
          title={
            typeFilter === type
              ? "Show all event types"
              : "Show only " + meta.label
          }
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 transition hover:bg-slate-100",
            typeFilter === type && "bg-slate-200 text-slate-900",
          )}
        >
          <span className={cn("size-2 rounded-full", meta.dot)} />
          {meta.label}
        </button>
      ) : (
        <span key={type} className="inline-flex items-center gap-1.5 rounded-md px-1 py-0.5" title={meta.label}><span className={cn("size-2 rounded-full", meta.dot)} />{meta.label}</span>
      ))}
    </div>
  );
}

function Filters({
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  organisationFilter,
  setOrganisationFilter,
  observerMode = false,
}: any) {
  return (
    <div className="mb-4 grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-2 sm:flex sm:flex-wrap sm:items-center">
      <span className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-slate-500">
        <Filter className="size-3.5" />
        Filters
      </span>
      <Select
        value={organisationFilter}
        onChange={(e) => setOrganisationFilter(e.target.value)}
        className="w-full sm:min-w-44 sm:flex-1"
      >
        <option value="all">{observerMode ? "All startup schedules" : "MASTER TEMPLATE · core events only"}</option>
        {organisations.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </Select>
      <span className="px-2 text-[10px] font-medium text-slate-500">
        {observerMode ? "Read-only view of published schedules. Choose a startup to focus its schedule." : "Shared core programme events only. Choose a startup below for bespoke events."}
      </span>
      <Select
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value)}
        className="w-full sm:min-w-40 sm:flex-1"
      >
        <option value="all">All item types</option>
        {Object.entries(itemMeta).map(([value, meta]) => (
          <option value={value} key={value}>
            {meta.label}
          </option>
        ))}
      </Select>
      {(observerMode || organisationFilter !== "all") && <Select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="w-full sm:min-w-36 sm:flex-1"
      >
        <option value="all">Startup response</option>
        <option value="confirmed">Accepted</option>
        <option value="pending">Pending</option>
        <option value="rejected">Rejected</option>
      </Select>}
    </div>
  );
}

function LegacySpreadsheetBoard({
  items,
  availability,
  isAdmin,
  profile,
  onSelect,
}: {
  items: ScheduleItem[];
  availability: AvailabilityBlock[];
  isAdmin: boolean;
  profile: Profile;
  onSelect: (id: string) => void;
}) {
  const rows = [...items].sort((a, b) => {
    if (!a.startsAt) return 1;
    if (!b.startsAt) return -1;
    return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
  });
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.03)]">
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-[.1em] text-slate-500">
            <tr>
              <th className="w-44 border-b border-slate-200 px-4 py-3">
                Date / time
              </th>
              <th className="border-b border-slate-200 px-4 py-3">
                Schedule item
              </th>
              <th className="w-44 border-b border-slate-200 px-4 py-3">Type</th>
              <th className="w-44 border-b border-slate-200 px-4 py-3">
                Organisation
              </th>
              <th className="w-36 border-b border-slate-200 px-4 py-3">
                Status
              </th>
              <th className="w-32 border-b border-slate-200 px-4 py-3">
                Booking
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((item) => {
              const meta = itemMeta[spreadsheetTypeFor(item)];
              const conflict = availability.some((block) =>
                overlaps(
                  block.startsAt,
                  block.endsAt,
                  item.startsAt,
                  item.endsAt,
                ),
              );
              return (
                <tr
                  key={item.id}
                  tabIndex={0}
                  onClick={() => onSelect(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ")
                      onSelect(item.id);
                  }}
                  className="cursor-pointer hover:bg-indigo-50/40 focus:bg-indigo-50/50 focus:outline-none"
                >
                  <td className="whitespace-nowrap px-4 py-3 align-top text-xs font-semibold text-slate-600">
                    {item.startsAt ? (
                      <>
                        <span className="block text-slate-900">
                          {format(new Date(item.startsAt), "EEE d MMM yyyy")}
                        </span>
                        <span className="mt-0.5 block text-slate-500">
                          {item.timePrecision === "all_day"
                            ? "All day"
                            : format(new Date(item.startsAt), "HH:mm")}
                          {item.endsAt &&
                            item.timePrecision !== "all_day" &&
                            `–${format(new Date(item.endsAt), "HH:mm")}`}
                        </span>
                      </>
                    ) : (
                      "Time to confirm"
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                      {item.location ||
                        item.description ||
                        "No additional details"}
                    </p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <span className={cn("size-2 rounded-full", meta.dot)} />
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-slate-600">
                    {item.organisationIds.length
                      ? item.organisationIds
                          .map(
                            (id) =>
                              organisations.find((org) => org.id === id)?.name,
                          )
                          .filter(Boolean)
                          .join(", ")
                      : "Cohort"}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-1 text-[10px] font-bold",
                        item.status === "confirmed"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700",
                      )}
                    >
                      {pretty(item.status)}
                    </span>
                    {conflict && (isAdmin || profile.organisationId) && (
                      <span className="ml-1 text-[10px] text-rose-600">
                        Conflict
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-xs font-medium text-slate-600">
                    {bookingLabel(item.bookingStatus)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <div className="p-10 text-center text-sm text-slate-500">
          No schedule items match the current filters.
        </div>
      )}
    </div>
  );
}

void LegacySpreadsheetBoard;

function SpreadsheetBoard({
  items,
  availability,
  isAdmin,
  masterTemplate,
  profile,
  language,
  anchorDate,
  onSelectDay,
  onSelect,
  onDecision,
}: {
  items: ScheduleItem[];
  availability: AvailabilityBlock[];
  isAdmin: boolean;
  masterTemplate?: boolean;
  profile: Profile;
  language: Language;
  anchorDate: Date;
  onSelectDay: (date: Date) => void;
  onSelect: (id: string) => void;
  onDecision: (item: ScheduleItem, decision: Decision) => void;
}) {
  const [pendingDecision, setPendingDecision] = useState<{
    item: ScheduleItem;
    decision: Decision;
  }>();
  useEffect(() => {
    if (!pendingDecision) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPendingDecision(undefined);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [pendingDecision]);
  const rows = items
    .filter(
      (item) =>
        !profile.organisationId ||
        !item.responses.some(
          (response) =>
            response.organisationId === profile.organisationId &&
            response.decision === "pass",
        ),
    )
    .sort((a, b) => (a.startsAt ?? "9999").localeCompare(b.startsAt ?? "9999"));
  const commitDecision = (decision: Decision) => {
    if (!pendingDecision) return;
    onDecision(pendingDecision.item, decision);
    setPendingDecision(undefined);
  };
  const showDecisionColumn = !isAdmin || !masterTemplate;
  const sheetCopy = language === "ko"
    ? { instruction: "행을 클릭하면 해당 행사/미팅의 전체 설명, 장소, 공식 링크와 상세 정보를 볼 수 있습니다.", event: "행사 / 미팅", start: "시작", end: "종료", type: "유형", decision: "결정", cost: "비용 / 메모", location: "장소" }
    : { instruction: "Click any row to open the full event or meeting record, including the complete description, venue and official link.", event: "Event / Meeting", start: "Start", end: "End", type: "Type", decision: "Decision", cost: "Cost / notes", location: "Location" };
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.03)]">
      <div className="border-b border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-950">{sheetCopy.instruction}</div>
      {sheetCopy.instruction.length === 0 && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <ol className="list-decimal space-y-1 pl-5 font-semibold marker:font-black">
            <li>
              {language === "ko"
                ? "노란색으로 강조된 항목부터 처리하세요. 항목을 열어 결정을 기록하면 LVCN이 일정을 조율할 수 있습니다."
                : "Resolve every glowing yellow item first. Open it and record your decision so LVCN can coordinate the schedule."}
            </li>
            <li>
              {language === "ko"
                ? "각 행을 선택하면 행사 세부 정보와 전체 장소 주소를 확인할 수 있습니다."
                : "Select any row to see the complete event details and full location."}
            </li>
          </ol>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-[1040px] w-full border-collapse text-left text-sm">
          <thead className="bg-[#286c58] text-[11px] font-bold text-white">
            <tr>
              <th className="min-w-[320px] border-b border-emerald-900/30 px-4 py-2">
                {sheetCopy.event}
              </th>
              <th className="w-20 border-b border-emerald-900/30 px-3 py-2">
                {sheetCopy.start}
              </th>
              <th className="w-20 border-b border-emerald-900/30 px-3 py-2">
                {sheetCopy.end}
              </th>
              <th className="w-44 border-b border-emerald-900/30 px-3 py-2">
                {sheetCopy.type}
              </th>
              {showDecisionColumn && <th className="w-32 border-b border-emerald-900/30 px-3 py-2">
                {sheetCopy.decision}
              </th>}
              <th className="w-36 border-b border-emerald-900/30 px-3 py-2">
                {sheetCopy.cost}
              </th>
              <th className="w-52 border-b border-emerald-900/30 px-3 py-2">
                {sheetCopy.location}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((item, index) => {
              const itemDate = safeDate(item.startsAt);
              const itemEndDate = safeDate(item.endsAt);
              const dateKey = itemDate
                ? format(itemDate, "yyyy-MM-dd")
                : "unknown";
              const previousItem = rows[index - 1];
              const previousItemDate = safeDate(previousItem?.startsAt)
                ? format(safeDate(previousItem?.startsAt)!, "yyyy-MM-dd")
                : previousItem
                  ? "unknown"
                  : "";
              const showDateBand = dateKey !== previousItemDate;
              const isAnchoredDate = itemDate
                ? isSameDay(itemDate, anchorDate)
                : false;
              const meta = itemMeta[spreadsheetTypeFor(item)];
              const decision = item.responses.find(
                (response) =>
                  response.organisationId === profile.organisationId,
              )?.decision;
              const adminDecisionSummary = item.responses.reduce(
                (summary, response) => {
                  if (["going", "acknowledged"].includes(response.decision)) summary.confirmed += 1;
                  else if (response.decision === "pass") summary.rejected += 1;
                  else summary.pending += 1;
                  return summary;
                },
                { pending: 0, confirmed: 0, rejected: 0 },
              );
              const adminDecision =
                adminDecisionSummary.pending > 0
                  ? "pending"
                  : adminDecisionSummary.confirmed > 0
                    ? "confirmed"
                    : item.responses.length > 0
                      ? "rejected"
                      : "pending";
              const isPendingDecision =
                !decision ||
                ["undecided", "interested", "acknowledged"].includes(decision);
              const availabilityConflict = availability.some((block) =>
                overlaps(
                  block.startsAt,
                  block.endsAt,
                  item.startsAt,
                  item.endsAt,
                ),
              );
              const alternativeChoiceConflict = Boolean(
                item.conflictGroupId &&
                  ["going", "interested"].includes(decision ?? "") &&
                  items.some(
                    (other) =>
                      other.id !== item.id &&
                      other.conflictGroupId === item.conflictGroupId &&
                      other.responses.some(
                        (response) =>
                          response.organisationId === profile.organisationId &&
                          ["going", "interested"].includes(response.decision),
                      ),
                  ),
              );
              const conflict = availabilityConflict || alternativeChoiceConflict;
              const scheduleOverlapItems = itemDate
                ? items.filter((other) => {
                    const otherDate = safeDate(other.startsAt);
                    const otherEndDate = safeDate(other.endsAt);
                    return (
                      other.id !== item.id &&
                      other.itemType !== "company_work" &&
                      otherDate &&
                      !other.responses.some(
                        (response) =>
                          response.organisationId === profile.organisationId &&
                          response.decision === "pass",
                      ) &&
                      overlaps(
                        itemDate.toISOString(),
                        (itemEndDate ?? new Date(itemDate.getTime() + 3600000)).toISOString(),
                        otherDate.toISOString(),
                        otherEndDate?.toISOString(),
                      )
                    );
                  })
                : [];
              const hasScheduleOverlap = scheduleOverlapItems.length > 0;
              const priceNote =
                item.costNote &&
                /(?:[£$€]\s*\d|\d+\s*(?:gbp|usd|eur))/i.test(item.costNote)
                  ? item.costNote
                  : "";
              const displayCost =
                priceNote ||
                item.costNote ||
                (item.costType === "paid"
                  ? "Paid — price to confirm"
                  : item.costType === "free"
                    ? "Free"
                    : "");
              return (
                <Fragment key={item.id}>
                  {showDateBand && (
                    <tr
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        itemDate && onSelectDay(itemDate)
                      }
                      onKeyDown={(event) => {
                        if (
                          (event.key === "Enter" || event.key === " ") &&
                          itemDate
                        )
                          onSelectDay(itemDate);
                      }}
                      className={cn(
                        "cursor-pointer bg-[#9acb82] text-[13px] font-bold text-slate-950 hover:bg-[#abd392]",
                        isAnchoredDate &&
                          "relative outline outline-2 outline-indigo-500 outline-offset-[-2px]",
                      )}
                    >
                      <td colSpan={showDecisionColumn ? 7 : 6} className="px-3 py-1.5">
                        {itemDate
                          ? format(itemDate, "EEEE, d MMMM yyyy")
                          : "Date to confirm"}
                      </td>
                    </tr>
                  )}
                  <tr
                    tabIndex={0}
                    onClick={() => onSelect(item.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ")
                        onSelect(item.id);
                    }}
                    className={cn(
                      "cursor-pointer odd:bg-white even:bg-slate-50/70 hover:bg-indigo-50/50 focus:bg-indigo-50/60 focus:outline-none",
                      conflict
                        ? "bg-rose-50/80 hover:bg-rose-100/80"
                        : hasScheduleOverlap && "bg-amber-50/80 hover:bg-amber-100/80",
                    )}
                  >
                    <td className="hidden">
                      {item.timePrecision === "all_day" ? "●" : ""}
                    </td>
                    <td className="px-4 py-2 align-top font-semibold text-slate-900">
                      <span className="flex items-center gap-2">
                        {item.title}
                        {conflict && (
                          <span className="urgent-attention inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold ring-2 ring-amber-300 ring-offset-1">
                            <AlertTriangle className="size-3" />
                            Clash
                          </span>
                        )}
                        {!conflict && hasScheduleOverlap && (
                          <span
                            title="Times overlap. This may still be manageable; review both events and choose the appropriate decisions."
                            className="urgent-attention inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold ring-2 ring-amber-300 ring-offset-1"
                          >
                            <AlertTriangle className="size-3" />
                            Time overlap
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 align-top text-xs font-semibold text-slate-700">
                      {itemDate && item.timePrecision !== "all_day"
                        ? format(itemDate, "HH:mm")
                        : itemDate
                          ? "All day"
                          : "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 align-top text-xs font-semibold text-slate-700">
                      {itemEndDate && item.timePrecision !== "all_day"
                        ? format(itemEndDate, "HH:mm")
                        : "—"}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <span className="inline-flex items-center gap-2 rounded-md bg-white/80 px-2 py-1 text-xs font-semibold text-slate-700">
                        <span className={cn("size-2 rounded-full", meta.dot)} />
                        {meta.label}
                      </span>
                    </td>
                    {showDecisionColumn && <td className="px-3 py-2 align-top">
                      {profile.organisationId && !isGenericBusinessMeetingSlot(item) ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setPendingDecision({
                              item,
                              decision:
                                decision === "pass"
                                  ? "going"
                                  : (decision ?? "going"),
                            });
                          }}
                          className={cn(
                            "inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold",
                            isPendingDecision
                              ? "urgent-attention ring-2 ring-amber-300 ring-offset-1"
                              : decision === "going"
                                ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300"
                                : "bg-slate-100 text-slate-700",
                            "hover:bg-indigo-100 hover:text-indigo-800 hover:shadow-none",
                          )}
                        >
                          {isPendingDecision
                            ? "Pending"
                            : decision === "going"
                              ? "Accepted"
                              : "Reject"}
                        </button>
                      ) : (
                        <span
                          className={cn(
                            "inline-flex rounded-md px-2 py-1 text-[10px] font-bold",
                            isAdmin
                              ? adminDecision === "confirmed"
                                ? "bg-emerald-100 text-emerald-800"
                                : adminDecision === "rejected"
                                  ? "bg-rose-100 text-rose-800"
                                  : "urgent-attention ring-2 ring-amber-300 ring-offset-1"
                              : decision === "going"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-700",
                          )}
                        >
                          {isAdmin
                            ? adminDecision === "confirmed"
                              ? "Accepted"
                              : adminDecision === "rejected"
                                ? "Rejected"
                                : "Pending"
                            : decision === "going"
                              ? "Confirmed"
                              : pretty(decision ?? "undecided")}
                        </span>
                      )}
                    </td>}
                    <td className="px-3 py-2 align-top text-xs text-slate-600">
                      <span className="block max-w-36 truncate" title={displayCost}>
                        {displayCost}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top text-xs text-slate-600">
                      <span
                        className="block max-w-[13rem] overflow-hidden text-ellipsis whitespace-nowrap rounded-md px-1 py-0.5 hover:bg-slate-100"
                        title={`${item.location || "London / TBC"} — Click the row for the full address`}
                      >
                        {item.location || "London / TBC"}
                      </span>
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <div className="p-10 text-center text-sm text-slate-500">
          No schedule items match the current filters.
        </div>
      )}
      {pendingDecision && (
        <div className="fixed left-1/2 top-24 z-[80] flex -translate-x-1/2 items-center gap-3 rounded-xl bg-slate-950 px-4 py-3 text-sm text-white shadow-2xl">
          <span>Choose a decision for “{pendingDecision.item.title}”</span>
          <button
            type="button"
            onClick={() => commitDecision("going")}
            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-400"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => commitDecision("pass")}
            className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-400"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => commitDecision("undecided")}
            className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-300"
          >
            Pending
          </button>
          <button
            type="button"
            onClick={() => setPendingDecision(undefined)}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function CalendarBoard({
  week,
  view,
  items,
  availability,
  isAdmin,
  profile,
  onSelect,
  onSelectDay,
  onCreateAt,
}: {
  week: Date;
  view: ViewMode;
  items: ScheduleItem[];
  availability: AvailabilityBlock[];
  isAdmin: boolean;
  profile: Profile;
  onSelect: (id: string) => void;
  onSelectDay: (date: Date) => void;
  onCreateAt: (startsAt?: string, endsAt?: string) => void;
}) {
  const days =
    view === "day"
      ? [isToday(week) ? week : startOfDay(week)]
      : Array.from({ length: 5 }, (_, index) =>
          addDays(startOfWeek(week, { weekStartsOn: 1 }), index),
        );
  if (view === "month")
    return (
      <MonthBoard
        week={week}
        items={items}
        onSelect={onSelect}
        onSelectDay={onSelectDay}
      />
    );
  return (
    <HourlyBoard
      days={days}
      items={items}
      availability={availability}
      isAdmin={isAdmin}
      profile={profile}
      onSelect={onSelect}
      onSelectDay={onSelectDay}
      onCreateAt={onCreateAt}
    />
  );
  /* return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.03)]">
      <div
        className={cn(
          "grid divide-x divide-slate-200",
          view === "day" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-5",
        )}
      >
        {days.map((day) => {
          const dayItems = items.filter(
            (item) => item.startsAt && isSameDay(new Date(item.startsAt), day),
          );
          const dayAvailability = availability.filter((block) =>
            isSameDay(new Date(block.startsAt), day),
          );
          return (
            <section key={day.toISOString()} className="min-h-[440px]">
              <div
                className={cn(
                  "border-b border-slate-200 bg-white px-3 py-3",
                  isToday(day) && "bg-indigo-50",
                )}
              >
                <p className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">
                  {format(day, "EEE")}
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xl font-semibold",
                      isToday(day) && "text-indigo-700",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {isToday(day) && (
                    <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                      Today
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2 p-2.5">
                {dayItems.map((item) => (
                  <EventCard
                    key={item.id}
                    item={item}
                    isAdmin={isAdmin}
                    profile={profile}
                    onClick={() => onSelect(item.id)}
                    availability={availability}
                  />
                ))}
                {dayAvailability.map((block) => (
                  <div
                    key={block.id}
                    className="rounded-xl border border-rose-200 bg-rose-50/70 p-3"
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                      <LockKeyhole className="size-3" />
                      {isAdmin
                        ? organisations.find(
                            (o) => o.id === block.organisationId,
                          )?.name
                        : "Company work"}
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-800">
                      {block.title}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {format(new Date(block.startsAt), "HH:mm")}–
                      {format(new Date(block.endsAt), "HH:mm")}
                    </p>
                  </div>
                ))}
                {dayItems.length === 0 && dayAvailability.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 px-3 py-8 text-center text-xs text-slate-400">
                    No items
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
      {unknown.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50/60 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-600">
            <CircleHelp className="size-4" />
            Time to confirm
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unknown.map((item) => (
              <EventCard
                key={item.id}
                item={item}
                isAdmin={isAdmin}
                profile={profile}
                onClick={() => onSelect(item.id)}
                availability={availability}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  ); */
}

function HourlyBoard({
  days,
  items,
  availability,
  isAdmin,
  profile,
  onSelect,
  onSelectDay,
  onCreateAt,
}: {
  days: Date[];
  items: ScheduleItem[];
  availability: AvailabilityBlock[];
  isAdmin: boolean;
  profile: Profile;
  onSelect: (id: string) => void;
  onSelectDay: (date: Date) => void;
  onCreateAt: (startsAt?: string, endsAt?: string) => void;
}) {
  const startHour = 9;
  const endHour = 21;
  const hourHeight = 64;
  const totalHeight = (endHour - startHour) * hourHeight;
  const [dragRange, setDragRange] = useState<{
    day: Date;
    startMinutes: number;
    endMinutes: number;
  }>();
  const minutesFromPointer = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const raw = startHour * 60 + ((event.clientY - rect.top) / hourHeight) * 60;
    return Math.max(
      startHour * 60,
      Math.min(endHour * 60, Math.round(raw / 30) * 30),
    );
  };
  const dateAtMinutes = (day: Date, minutes: number) => {
    const date = new Date(day);
    date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    return date.toISOString();
  };
  const place = (start: string, end?: string) => {
    const begins = new Date(start);
    const finishes = end ? new Date(end) : new Date(begins.getTime() + 3600000);
    const minutes = begins.getHours() * 60 + begins.getMinutes();
    const top = Math.max(
      0,
      Math.min(
        totalHeight - 28,
        ((minutes - startHour * 60) / 60) * hourHeight,
      ),
    );
    return {
      top,
      height: Math.max(
        38,
        Math.min(
          totalHeight - top,
          (Math.max(30, (finishes.getTime() - begins.getTime()) / 60000) / 60) *
            hourHeight,
        ),
      ),
    };
  };
  const layoutOverlaps = (dayItems: ScheduleItem[]) => {
    const sorted = [...dayItems].sort(
      (a, b) =>
        new Date(a.startsAt!).getTime() - new Date(b.startsAt!).getTime(),
    );
    const groups: ScheduleItem[][] = [];
    let groupEnd = 0;
    sorted.forEach((item) => {
      const starts = new Date(item.startsAt!).getTime();
      const ends = item.endsAt
        ? new Date(item.endsAt).getTime()
        : starts + 60 * 60 * 1000;
      if (!groups.length || starts >= groupEnd) {
        groups.push([item]);
        groupEnd = ends;
      } else {
        groups.at(-1)!.push(item);
        groupEnd = Math.max(groupEnd, ends);
      }
    });
    return groups.flatMap((group) => {
      const columnEnds: number[] = [];
      const assigned = group.map((item) => {
        const starts = new Date(item.startsAt!).getTime();
        const ends = item.endsAt
          ? new Date(item.endsAt).getTime()
          : starts + 60 * 60 * 1000;
        let column = columnEnds.findIndex((end) => end <= starts);
        if (column === -1) {
          column = columnEnds.length;
          columnEnds.push(ends);
        } else {
          columnEnds[column] = ends;
        }
        return { item, column };
      });
      return assigned.map(({ item, column }) => ({
        item,
        style: {
          ...place(item.startsAt!, item.endsAt),
          left: `calc(${(column / columnEnds.length) * 100}% + 4px)`,
          width: `calc(${100 / columnEnds.length}% - 8px)`,
        },
      }));
    });
  };
  const timed = items.filter(
    (item) => item.startsAt && item.timePrecision !== "all_day",
  );
  const unknown = items.filter(
    (item) => !item.startsAt || item.timePrecision === "all_day",
  );
  const scheduleOverlapsFor = (item: ScheduleItem) =>
    timed.filter(
      (other) =>
        other.id !== item.id &&
        other.itemType !== "company_work" &&
        !other.responses.some(
          (response) =>
            response.organisationId === profile.organisationId &&
            response.decision === "pass",
        ) &&
        overlaps(
          item.startsAt!,
          item.endsAt ?? new Date(new Date(item.startsAt!).getTime() + 3600000).toISOString(),
          other.startsAt!,
          other.endsAt,
        ),
    );
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.03)]">
      <div className="min-w-0">
        <div
          className="grid border-b border-slate-200"
          style={{
            gridTemplateColumns: `52px repeat(${days.length}, minmax(0, 1fr))`,
          }}
        >
          <div />
          {days.map((day) => (
            <div
              key={day.toISOString()}
              role="button"
              tabIndex={0}
              onClick={() => onSelectDay(day)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ")
                  onSelectDay(day);
              }}
              className={cn(
                "cursor-pointer border-l border-slate-200 px-3 py-2.5 hover:bg-indigo-50",
                isToday(day) && "bg-indigo-50",
              )}
            >
              <p className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">
                {format(day, "EEE")}
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <span
                  className={cn(
                    "text-lg font-semibold",
                    isToday(day) && "text-indigo-700",
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div
          className="grid"
          style={{
            gridTemplateColumns: `52px repeat(${days.length}, minmax(0, 1fr))`,
          }}
        >
          <div className="relative text-right text-[10px] text-slate-400">
            {Array.from({ length: endHour - startHour + 1 }, (_, index) => (
              <span
                key={index}
                className="absolute right-2"
                style={{ top: index * hourHeight - 7 }}
              >
                {String(startHour + index).padStart(2, "0")}:00
              </span>
            ))}
          </div>
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "relative border-l border-slate-200",
                isToday(day) && "bg-indigo-50/30",
              )}
              style={{
                height: totalHeight,
                backgroundImage:
                  "repeating-linear-gradient(to bottom, transparent, transparent 63px, rgb(226 232 240) 64px)",
              }}
              onPointerDown={(event) => {
                if ((event.target as HTMLElement).closest("button")) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                const minutes = minutesFromPointer(event);
                setDragRange({
                  day,
                  startMinutes: minutes,
                  endMinutes: Math.min(endHour * 60, minutes + 30),
                });
              }}
              onPointerMove={(event) => {
                if (
                  !dragRange ||
                  dragRange.day.toISOString() !== day.toISOString()
                )
                  return;
                const minutes = minutesFromPointer(event);
                setDragRange((current) =>
                  current
                    ? {
                        ...current,
                        endMinutes: Math.max(
                          current.startMinutes + 30,
                          minutes,
                        ),
                      }
                    : current,
                );
              }}
              onPointerUp={(event) => {
                if (
                  !dragRange ||
                  dragRange.day.toISOString() !== day.toISOString()
                )
                  return;
                const minutes = Math.max(
                  dragRange.startMinutes + 30,
                  minutesFromPointer(event),
                );
                onCreateAt(
                  dateAtMinutes(day, dragRange.startMinutes),
                  dateAtMinutes(day, Math.min(endHour * 60, minutes)),
                );
                setDragRange(undefined);
              }}
            >
              {layoutOverlaps(
                timed.filter((item) =>
                  isSameDay(new Date(item.startsAt!), day),
                ),
              ).map(({ item, style }) => (
                <TimedEvent
                  key={item.id}
                  item={item}
                  isAdmin={isAdmin}
                  profile={profile}
                  availability={availability}
                  scheduleOverlaps={scheduleOverlapsFor(item)}
                  onClick={() => onSelect(item.id)}
                  style={style}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      {unknown.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50/60 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-600">
            <CircleHelp className="size-4" />
            All day / time to confirm
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unknown.map((item) => (
              <EventCard
                key={item.id}
                item={item}
                isAdmin={isAdmin}
                profile={profile}
                onClick={() => onSelect(item.id)}
                availability={availability}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TimedEvent({
  item,
  isAdmin,
  profile,
  availability,
  scheduleOverlaps,
  onClick,
  style,
}: {
  item: ScheduleItem;
  isAdmin: boolean;
  profile: Profile;
  availability: AvailabilityBlock[];
  scheduleOverlaps: ScheduleItem[];
  onClick: () => void;
  style: { top: number; height: number; left: string; width: string };
}) {
  const meta = itemMeta[item.itemType];
  const response = item.responses.find(
    (entry) => entry.organisationId === profile.organisationId,
  );
  const conflict = availability.some(
    (block) =>
      (isAdmin || block.organisationId === profile.organisationId) &&
      overlaps(block.startsAt, block.endsAt, item.startsAt, item.endsAt),
  );
  const hasScheduleOverlap = scheduleOverlaps.length > 0;
  return (
    <button
      onClick={onClick}
      className={cn(
        "absolute z-20 overflow-hidden rounded-md border px-2 py-1 text-left shadow-sm transition hover:z-30 hover:shadow-md",
        calendarState(item, response?.decision),
        conflict
          ? "urgent-attention"
          : hasScheduleOverlap && "urgent-attention",
      )}
      style={style}
    >
      <div className="flex items-center gap-1">
        <span className={cn("size-1.5 shrink-0 rounded-full", meta.dot)} />
        <p className="truncate text-[10px] font-bold leading-4 text-slate-900">
          {item.title}
        </p>
        {conflict && (
          <AlertTriangle className="ml-auto size-3 shrink-0 text-rose-600" />
        )}
        {!conflict && hasScheduleOverlap && (
          <span title="Time overlap — review both events; you may still be able to attend parts of each." className="ml-auto text-[8px] font-black uppercase tracking-wide text-amber-900">Overlap</span>
        )}
      </div>
      <p className="truncate text-[9px] text-slate-600">
        {format(new Date(item.startsAt!), "HH:mm")}{" "}
        {item.location && `· ${item.location}`}
        {!isAdmin && response && ` · ${pretty(response.decision)}`}
      </p>
    </button>
  );
}

function MonthBoard({
  week,
  items,
  onSelect,
  onSelectDay,
}: {
  week: Date;
  items: ScheduleItem[];
  onSelect: (id: string) => void;
  onSelectDay: (date: Date) => void;
}) {
  const first = new Date(week.getFullYear(), week.getMonth(), 1);
  const start = startOfWeek(first, { weekStartsOn: 1 });
  const days = Array.from({ length: 42 }, (_, index) =>
    addDays(start, index),
  ).filter((day) => day.getDay() !== 0 && day.getDay() !== 6);
  return (
    <div className="grid grid-cols-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {days.map((day) => (
        <div
          key={day.toISOString()}
          role="button"
          tabIndex={0}
          aria-label={`Focus ${format(day, "EEEE, d MMMM yyyy")}`}
          onClick={() => onSelectDay(day)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") onSelectDay(day);
          }}
          className={cn(
            "min-h-28 cursor-pointer border-b border-r border-slate-100 p-2",
            day.getMonth() !== week.getMonth() && "bg-slate-50 text-slate-400",
            isToday(day) && "bg-indigo-50/50",
            isSameDay(day, week) &&
              "bg-indigo-50 ring-2 ring-inset ring-indigo-500",
          )}
        >
          <p className="text-xs font-bold">{format(day, "d")}</p>
          {items
            .filter(
              (item) =>
                item.startsAt && isSameDay(new Date(item.startsAt), day),
            )
            .slice(0, 3)
            .map((item) => (
              <button
                key={item.id}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectDay(day);
                  onSelect(item.id);
                }}
                className={cn(
                  "mt-1 block w-full truncate rounded border px-1.5 py-1 text-left text-[9px] font-semibold text-slate-800",
                  calendarState(item),
                )}
              >
                {item.title}
              </button>
            ))}
        </div>
      ))}
    </div>
  );
}

function EventCard({
  item,
  onClick,
  isAdmin,
  profile,
  availability,
}: {
  item: ScheduleItem;
  onClick: () => void;
  isAdmin: boolean;
  profile: Profile;
  availability: AvailabilityBlock[];
}) {
  const meta = itemMeta[item.itemType];
  const response = item.responses.find(
    (entry) => entry.organisationId === profile.organisationId,
  );
  const conflict = availability.some(
    (block) =>
      (isAdmin || block.organisationId === profile.organisationId) &&
      overlaps(block.startsAt, block.endsAt, item.startsAt, item.endsAt),
  );
  const decisionPending =
    item.status !== "confirmed" &&
    !["going", "acknowledged"].includes(response?.decision ?? "");
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md",
        calendarState(item, response?.decision),
        (decisionPending || conflict) && "urgent-attention",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[.12em]",
            meta.accent,
          )}
        >
          <span className={cn("size-1.5 rounded-full", meta.dot)} />
          {meta.label}
        </span>
        {decisionPending && (
          <span className="urgent-attention rounded px-1.5 py-0.5 text-[9px] font-bold">
            Decision pending
          </span>
        )}
        {conflict && <AlertTriangle className="size-3.5 text-rose-600" />}
      </div>
      <p className="mt-1.5 text-xs font-bold leading-[1.35] text-slate-900">
        {item.title}
      </p>
      <div className="mt-2 space-y-1 text-[10px] font-medium text-slate-500">
        {item.startsAt && (
          <p className="flex items-center gap-1">
            <Clock3 className="size-3" />
            {item.timePrecision === "all_day"
              ? "All day"
              : format(new Date(item.startsAt), "HH:mm")}
          </p>
        )}
        {item.location && (
          <p className="flex items-center gap-1 truncate">
            <MapPin className="size-3 shrink-0" />
            {item.location}
          </p>
        )}
      </div>
      {!isAdmin && response && (
        <span className="mt-2 inline-flex rounded-full bg-white/80 px-2 py-0.5 text-[9px] font-bold text-slate-700 ring-1 ring-slate-200">
          {pretty(response.decision)}
        </span>
      )}
      {isAdmin && (
        <div className="mt-2 flex gap-1 text-[9px] font-bold text-slate-600">
          <span>
            {
              item.responses.filter((r) =>
                ["going", "acknowledged"].includes(r.decision),
              ).length
            }{" "}
            going
          </span>
          <span>·</span>
          <span>
            {item.responses.filter((r) => r.decision === "undecided").length}{" "}
            open
          </span>
        </div>
      )}
    </button>
  );
}

function BusinessMeetingColumnHeader({
  columnId,
  label,
  className = "",
  isAdmin,
  visible,
  onVisibilityChange,
  onFilterClick,
  filterActive = false,
}: {
  columnId: string;
  label: string;
  className?: string;
  isAdmin: boolean;
  visible: boolean;
  onVisibilityChange: (columnId: string, visible: boolean) => void;
  onFilterClick?: (columnId: string) => void;
  filterActive?: boolean;
}) {
  return (
    <th className={cn("px-4 py-2.5", className)}>
      <span className="flex items-center gap-1.5">
        {label}
        {isAdmin && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onVisibilityChange(columnId, !visible);
            }}
            className="rounded p-0.5 text-white/75 hover:bg-white/15 hover:text-white"
            title={visible ? "Hide from startups" : "Show to startups"}
            aria-label={`${visible ? "Hide" : "Show"} ${label} for startups`}
            aria-pressed={visible}
          >
            {visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
          </button>
        )}
        {onFilterClick && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onFilterClick(columnId);
            }}
            className={cn("rounded p-0.5 hover:bg-white/15", filterActive ? "bg-white/20 text-white" : "text-white/75 hover:text-white")}
            title={`Filter ${label}`}
            aria-label={`Filter ${label}`}
          >
            <Filter className="size-3.5" />
          </button>
        )}
      </span>
    </th>
  );
}

function WeeklyProgrammeRecordPage({ items, organisationNames }: { items: ScheduleItem[]; organisationNames: Record<string, string> }) {
  const [startupId, setStartupId] = useState("all");
  const [weekKey, setWeekKey] = useState("2026-09-14");
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);
  const weeks = useMemo(() => {
    const programmeStart = new Date(2026, 8, 14);
    const programmeEnd = new Date(2026, 9, 23, 23, 59, 59);
    const result: { key: string; start: Date; end: Date; label: string }[] = [];
    for (let cursor = startOfWeek(programmeStart, { weekStartsOn: 1 }); cursor <= programmeEnd; cursor = addDays(cursor, 7)) {
      const end = endOfWeek(cursor, { weekStartsOn: 1 }) > programmeEnd ? programmeEnd : endOfWeek(cursor, { weekStartsOn: 1 });
      result.push({ key: format(cursor, "yyyy-MM-dd"), start: cursor, end, label: `${format(cursor, "d MMM")} – ${format(end, "d MMM yyyy")}` });
    }
    return result;
  }, []);
  const startupOptions = useMemo(() => Array.from(new Set(items.flatMap((item) => item.organisationIds))).map((id) => ({ id, name: organisationNames[id] ?? "Startup" })).sort((a, b) => a.name.localeCompare(b.name)), [items, organisationNames]);
  const week = weeks.find((entry) => entry.key === weekKey) ?? weeks[0];
  const rows = useMemo(() => {
    if (!week) return [];
    return items.filter((item) => {
      if (item.itemType === "business_meeting" || !item.startsAt) return false;
      const date = new Date(item.startsAt);
      const inWeek = date >= week.start && date <= week.end;
      const forStartup = startupId === "all" || item.organisationIds.length === 0 || item.organisationIds.includes(startupId);
      return inWeek && forStartup;
    }).sort((a, b) => (a.startsAt ?? "").localeCompare(b.startsAt ?? ""));
  }, [items, startupId, week]);
  const reportRows = rows.map((item) => {
    const response = startupId === "all" ? undefined : item.responses.find((entry) => entry.organisationId === startupId);
    const declined = item.status === "cancelled" || response?.decision === "pass";
    return {
      title: item.title,
      date: item.startsAt ? format(new Date(item.startsAt), "EEE d MMM yyyy") : "Time to confirm",
      time: item.startsAt ? `${format(new Date(item.startsAt), "HH:mm")}–${item.endsAt ? format(new Date(item.endsAt), "HH:mm") : ""}` : "—",
      type: itemMeta[item.itemType].label,
      location: item.location ?? "—",
      status: item.status === "cancelled" ? "Cancelled (retained)" : item.status === "confirmed" ? "Confirmed" : "Proposed",
      attendance: startupId === "all" ? "Startup-specific view" : response?.decision === "going" ? "Accepted" : response?.decision === "pass" ? "Declined" : "Pending",
      notes: declined ? "Scheduled record retained for audit; no longer attending." : item.nextAction ?? item.fit ?? "—",
      greyed: declined,
    };
  });
  const active = reportRows.filter((row) => !row.greyed).length;
  const greyed = reportRows.length - active;
  const startupName = startupId === "all" ? "Programme overview" : organisationNames[startupId] ?? "Startup";
  const doExport = async (kind: "excel" | "pdf") => {
    if (!week || startupId === "all") return;
    setExporting(kind);
    try {
      const exporters = await import("./lib/export");
      const meta = { startupName, weekLabel: `Week commencing ${week.label}` };
      if (kind === "excel") await exporters.exportWeeklyScheduleExcel(reportRows, meta);
      else exporters.exportWeeklySchedulePdf(reportRows, meta);
    } finally { setExporting(null); }
  };
  return <div>
    <p className="text-xs font-bold uppercase tracking-[.15em] text-indigo-600">Admin workspace</p>
    <div className="mt-1"><h1 className="text-3xl font-semibold tracking-tight">Programme Record</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Weekly schedule snapshots for backup, review and sponsor-ready reporting. Declined and cancelled records stay visible as greyed audit entries.</p></div>
    <section className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5"><div className="grid gap-4 md:grid-cols-2"><label><FieldLabel>Week commencing</FieldLabel><Select value={weekKey} onChange={(event) => setWeekKey(event.target.value)}>{weeks.map((entry) => <option key={entry.key} value={entry.key}>{entry.label}</option>)}</Select></label><label><FieldLabel>Schedule for</FieldLabel><Select value={startupId} onChange={(event) => setStartupId(event.target.value)}><option value="all">Choose all startups (overview)</option>{startupOptions.map((startup) => <option key={startup.id} value={startup.id}>{startup.name}</option>)}</Select></label></div><p className="mt-3 text-xs leading-5 text-indigo-950">Exports are kept separate by startup so attendance times are never incorrectly merged into one programme timetable.</p></section>
    <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-3xl font-bold text-indigo-700">{reportRows.length}</p><p className="mt-1 text-sm font-semibold text-slate-600">Events in this week</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-3xl font-bold text-emerald-700">{active}</p><p className="mt-1 text-sm font-semibold text-slate-600">Active schedule entries</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-3xl font-bold text-slate-500">{greyed}</p><p className="mt-1 text-sm font-semibold text-slate-600">Declined / cancelled retained</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-3xl font-bold text-slate-900">{new Set(reportRows.map((row) => row.date)).size}</p><p className="mt-1 text-sm font-semibold text-slate-600">Days with activity</p></div></section>
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Export weekly snapshot</h2><p className="mt-1 text-sm text-slate-500">{startupName} · {week?.label ?? ""} · {reportRows.length} schedule entries</p>{startupId === "all" && <p className="mt-1 text-xs font-semibold text-amber-700">Select one startup above to export its separate schedule.</p>}</div><div className="flex gap-2"><Button type="button" variant="secondary" disabled={Boolean(exporting) || startupId === "all"} onClick={() => void doExport("excel")}><Download className="mr-1.5 size-4" />{exporting === "excel" ? "Preparing…" : "Schedule spreadsheet"}</Button><Button type="button" variant="indigo" disabled={Boolean(exporting) || startupId === "all"} onClick={() => void doExport("pdf")}><FileDown className="mr-1.5 size-4" />{exporting === "pdf" ? "Preparing…" : "Calendar PDF"}</Button></div></div></section>
    <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="min-w-[980px] w-full text-left text-sm"><thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-[.1em] text-slate-500"><tr><th className="px-4 py-3">Event</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Time</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Attendance</th><th className="px-4 py-3">Notes</th></tr></thead><tbody className="divide-y divide-slate-100">{reportRows.map((row) => <tr key={`${row.date}-${row.title}`} className={row.greyed ? "bg-slate-100 text-slate-400 line-through" : ""}><td className="px-4 py-3 font-semibold">{row.title}</td><td className="px-4 py-3">{row.date}</td><td className="px-4 py-3">{row.time}</td><td className="px-4 py-3">{row.type}</td><td className="px-4 py-3">{row.location}</td><td className="px-4 py-3">{row.attendance}</td><td className="px-4 py-3 no-underline">{row.notes}</td></tr>)}{!reportRows.length && <tr><td colSpan={7} className="p-10 text-center text-sm text-slate-500">No schedule entries for this startup and week.</td></tr>}</tbody></table></div></section>
  </div>;
}

// Retained while old report links are migrated to WeeklyProgrammeRecordPage.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ProgrammeRecordPage({ items, potentialMeetings, organisationNames }: { items: ScheduleItem[]; potentialMeetings: PotentialMeeting[]; organisationNames: Record<string, string> }) {
  const [status, setStatus] = useState<"all" | ScheduleItem["status"]>("all");
  const [selectedStartupId, setSelectedStartupId] = useState("all");
  const visible = items.filter((item) => status === "all" || item.status === status).sort((a, b) => (a.startsAt ?? "9999").localeCompare(b.startsAt ?? "9999"));
  const decisions = items.flatMap((item) => item.responses);
  const startupOptions = Array.from(new Set([
    ...Object.keys(organisationNames),
    ...items.flatMap((item) => [...item.organisationIds, ...item.responses.map((response) => response.organisationId)]),
    ...potentialMeetings.map((meeting) => meeting.organisationId),
  ])).map((id) => ({ id, name: organisationNames[id] ?? organisations.find((organisation) => organisation.id === id)?.name ?? "Startup" })).sort((a, b) => a.name.localeCompare(b.name));
  const selectedStartup = selectedStartupId === "all" ? undefined : startupOptions.find((startup) => startup.id === selectedStartupId);
  const proposedForStartup = selectedStartupId === "all" ? [] : items.filter((item) => item.organisationIds.length === 0 || item.organisationIds.includes(selectedStartupId)).sort((a, b) => (a.startsAt ?? "9999").localeCompare(b.startsAt ?? "9999"));
  const potentialForStartup = selectedStartupId === "all" ? [] : potentialMeetings.filter((meeting) => meeting.organisationId === selectedStartupId).sort((a, b) => (a.proposedStartsAt ?? "9999").localeCompare(b.proposedStartsAt ?? "9999"));
  const responseFor = (item: ScheduleItem) => item.responses.find((response) => response.organisationId === selectedStartupId);
  const finalSchedule = proposedForStartup.filter((item) => item.status === "confirmed" && responseFor(item)?.decision === "going");
  const finalPotential = potentialForStartup.filter((meeting) => meeting.status === "agreed" && meeting.decision === "going");
  const startupMetrics = selectedStartupId === "all" ? [] : [
    { label: "Schedule items offered", value: proposedForStartup.length, tone: "text-indigo-700" },
    { label: "Final schedule items", value: finalSchedule.length, tone: "text-emerald-700" },
    { label: "Potential Biz Meets offered", value: potentialForStartup.length, tone: "text-indigo-700" },
    { label: "Final Biz Meets", value: finalPotential.length, tone: "text-emerald-700" },
    { label: "Choices still pending", value: proposedForStartup.filter((item) => responseFor(item)?.decision === "undecided").length + potentialForStartup.filter((meeting) => meeting.decision === "undecided").length, tone: "text-amber-700" },
  ];
  const metrics = [
    { label: "Items recorded", value: items.length, tone: "text-slate-900" },
    { label: "Confirmed", value: items.filter((item) => item.status === "confirmed").length, tone: "text-emerald-700" },
    { label: "Proposed", value: items.filter((item) => item.status === "proposed").length, tone: "text-amber-700" },
    { label: "Cancelled, retained", value: items.filter((item) => item.status === "cancelled").length, tone: "text-rose-700" },
    { label: "Startup accepts", value: decisions.filter((response) => response.decision === "going").length + potentialMeetings.filter((meeting) => meeting.decision === "going").length, tone: "text-emerald-700" },
    { label: "Startup declines", value: decisions.filter((response) => response.decision === "pass").length + potentialMeetings.filter((meeting) => meeting.decision === "pass").length, tone: "text-rose-700" },
  ];
  return <div><p className="text-xs font-bold uppercase tracking-[.15em] text-indigo-600">Admin workspace</p><div className="mt-1 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-semibold tracking-tight">Programme Record</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Use one startup view for a sponsor-ready account of everything LVCN proposed, then the final schedule and business introductions the startup accepted. Cancelled items remain in the history.</p></div><Button type="button" variant="secondary" onClick={() => window.print()}><Printer className="mr-1.5 size-4" />Print / Save PDF</Button></div>
    <section className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5"><div className="flex flex-wrap items-end gap-4"><label className="min-w-64 flex-1"><FieldLabel>Supervisor report for</FieldLabel><Select value={selectedStartupId} onChange={(event) => setSelectedStartupId(event.target.value)}><option value="all">Programme-wide overview</option>{startupOptions.map((startup) => <option key={startup.id} value={startup.id}>{startup.name}</option>)}</Select></label>{selectedStartup && <p className="max-w-xl text-sm leading-6 text-indigo-950"><strong>{selectedStartup.name}</strong>: the left-hand records show LVCN activity and the right-hand records show only confirmed items the startup accepted.</p>}</div></section>
    {selectedStartup ? <><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{startupMetrics.map((metric) => <section key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-4"><p className={cn("text-3xl font-bold", metric.tone)}>{metric.value}</p><p className="mt-1 text-sm font-semibold text-slate-600">{metric.label}</p></section>)}</div><div className="mt-5 grid gap-5 xl:grid-cols-2"><ProgrammeRecordList title="Everything LVCN proposed" description="All targeted and cohort schedule items, including cancelled records, plus every Potential Biz Meet considered for this startup." scheduleItems={proposedForStartup} potentialMeetings={potentialForStartup} responseFor={responseFor} /><ProgrammeRecordList title="Finalised for this startup" description="Confirmed schedule items accepted by the startup, and agreed business introductions accepted by the startup." scheduleItems={finalSchedule} potentialMeetings={finalPotential} responseFor={responseFor} finalOnly /></div></> : <><div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{metrics.map((metric) => <section key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-4"><p className={cn("text-3xl font-bold", metric.tone)}>{metric.value}</p><p className="mt-1 text-sm font-semibold text-slate-600">{metric.label}</p></section>)}</div><div className="mt-6 flex flex-wrap gap-2">{(["all", "proposed", "confirmed", "cancelled"] as const).map((option) => <button key={option} type="button" onClick={() => setStatus(option)} className={cn("rounded-full border px-3 py-1.5 text-xs font-bold", status === option ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600")}>{option === "all" ? "All items" : pretty(option)}</button>)}</div><section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="max-h-[38rem] overflow-auto"><table className="min-w-[860px] w-full text-left text-sm"><thead className="sticky top-0 bg-slate-50 text-[10px] font-bold uppercase tracking-[.1em] text-slate-500"><tr><th className="px-4 py-3">Item</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Target startups</th><th className="px-4 py-3">Responses</th></tr></thead><tbody className="divide-y divide-slate-100">{visible.map((item) => <tr key={item.id}><td className="px-4 py-3"><p className="font-semibold text-slate-900">{item.title}</p><p className="mt-1 text-xs text-slate-500">{itemMeta[item.itemType].label}</p></td><td className="px-4 py-3 text-xs text-slate-600">{dateLabel(item)}</td><td className="px-4 py-3"><span className={cn("rounded-full px-2 py-1 text-[10px] font-bold", item.status === "confirmed" ? "bg-emerald-100 text-emerald-800" : item.status === "cancelled" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800")}>{pretty(item.status)}</span></td><td className="px-4 py-3 text-xs text-slate-600">{item.organisationIds.length ? item.organisationIds.map((id) => organisationNames[id] ?? "Startup").join(", ") : "Cohort"}</td><td className="px-4 py-3 text-xs text-slate-600">{item.responses.filter((response) => response.decision === "going").length} accepted · {item.responses.filter((response) => response.decision === "pass").length} declined · {item.responses.filter((response) => response.decision === "undecided").length} pending</td></tr>)}{!visible.length && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No items match this status.</td></tr>}</tbody></table></div></section></>}</div>;
}

function StartupUpdatesPage({ updates, schemaReady, isAdmin, organisationNames, onMarkAllRead, onSend }: { updates: StartupUpdate[]; schemaReady: boolean; isAdmin: boolean; organisationNames: Record<string, string>; onMarkAllRead: () => void; onSend: (organisationId: string, title: string, body: string) => void }) {
  const [kind, setKind] = useState<"all" | StartupUpdate["kind"]>("all");
  const [recipient, setRecipient] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const visible = updates.filter((update) => !update.readAt && (kind === "all" || update.kind === kind)).slice(0, 30);
  const unread = updates.filter((update) => !update.readAt).length;
  const tone = (update: StartupUpdate) => update.kind === "schedule" ? "border-indigo-200 bg-indigo-50/60 text-indigo-800" : update.kind === "potential_biz_meet" ? "border-emerald-200 bg-emerald-50/60 text-emerald-800" : "border-amber-200 bg-amber-50/60 text-amber-800";
  const label = (value: StartupUpdate["kind"]) => value === "schedule" ? "Schedule" : value === "potential_biz_meet" ? "Potential Biz Meet" : "Admin message";
  const recipients = Object.entries(organisationNames).sort(([, a], [, b]) => a.localeCompare(b));
  return <div><p className="text-xs font-bold uppercase tracking-[.15em] text-indigo-600">{isAdmin ? "Admin workspace" : "Programme communications"}</p><div className="mt-1 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-semibold tracking-tight">Startup Updates</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Your action inbox: it shows at most 30 current updates. Once read, an update leaves this page; the programme record remains available to LVCN.</p></div>{!isAdmin && unread > 0 && <Button type="button" variant="secondary" onClick={onMarkAllRead}>Clear {unread} update{unread === 1 ? "" : "s"}</Button>}</div>
    {!schemaReady ? <section className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><strong>Updates are ready in the app, but the database migration has not been applied yet.</strong><p className="mt-1">Apply <code>supabase/migrations/202609170024_startup_updates_inbox.sql</code> when you are ready. Until then, existing schedule and Potential Biz Meet pages continue to work normally.</p></section> : <><div className="mt-6 flex flex-wrap gap-2">{(["all", "schedule", "potential_biz_meet", "admin_message"] as const).map((option) => <button key={option} type="button" onClick={() => setKind(option)} className={cn("rounded-full border px-3 py-1.5 text-xs font-bold", kind === option ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600")}>{option === "all" ? "All updates" : label(option)}</button>)}</div>
      {isAdmin && <section className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5"><h2 className="font-semibold text-indigo-950">Send an admin message</h2><p className="mt-1 text-sm text-indigo-900">This creates a permanent, startup-visible update. Use it for information that should not be lost in a decision thread.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><label><FieldLabel>Startup</FieldLabel><Select value={recipient} onChange={(event) => setRecipient(event.target.value)}><option value="">Choose a startup</option>{recipients.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</Select></label><label><FieldLabel>Subject</FieldLabel><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Programme update" /></label><label className="sm:col-span-2 text-sm font-semibold text-slate-700">Message<textarea value={body} onChange={(event) => setBody(event.target.value)} className="mt-1 min-h-20 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm" placeholder="What the startup needs to know" /></label></div><Button type="button" variant="indigo" className="mt-3" disabled={!recipient || !title.trim()} onClick={() => { onSend(recipient, title.trim(), body.trim()); setTitle(""); setBody(""); }}>Send update</Button></section>}
      <section className="mt-5 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">{visible.map((update) => <article key={update.id} className={cn("border-l-4 p-5", update.readAt ? "border-l-slate-200" : "border-l-amber-400", !update.readAt && "bg-amber-50/30")}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><span className={cn("rounded-full border px-2 py-1 text-[10px] font-bold", tone(update))}>{label(update.kind)}</span>{isAdmin && <span className="text-xs font-semibold text-slate-500">{organisationNames[update.organisationId] ?? "Startup"}</span>}{!update.readAt && <span className="rounded-full bg-amber-200 px-2 py-1 text-[10px] font-bold text-amber-950">New</span>}</div><h2 className="mt-2 font-semibold text-slate-950">{update.title}</h2>{update.body && <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-600">{update.body}</p>}</div><time className="text-xs text-slate-500">{format(new Date(update.createdAt), "d MMM yyyy, HH:mm")}</time></div></article>)}{!visible.length && <p className="p-10 text-center text-sm text-slate-500">No updates in this view yet.</p>}</section></>}</div>;
}

function ProgrammeRecordList({ title, description, scheduleItems, potentialMeetings, responseFor, finalOnly = false }: { title: string; description: string; scheduleItems: ScheduleItem[]; potentialMeetings: PotentialMeeting[]; responseFor: (item: ScheduleItem) => ScheduleItem["responses"][number] | undefined; finalOnly?: boolean }) {
  const scheduleStatus = (item: ScheduleItem) => item.status === "confirmed" ? "bg-emerald-100 text-emerald-800" : item.status === "cancelled" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800";
  const responseLabel = (decision: Decision) => decision === "going" ? "Accepted" : decision === "pass" ? "Rejected" : "Pending";
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 p-5"><h2 className="text-lg font-semibold text-slate-950">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{description}</p></div><div className="max-h-[38rem] divide-y divide-slate-100 overflow-y-auto">{scheduleItems.map((item) => { const response = responseFor(item); return <article key={item.id} className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{item.title}</p><p className="mt-1 text-xs text-slate-500">Schedule · {dateLabel(item)}</p></div><span className={cn("shrink-0 rounded-full px-2 py-1 text-[10px] font-bold", scheduleStatus(item))}>{pretty(item.status)}</span></div><p className="mt-2 text-xs text-slate-600">Startup response: <strong>{response ? responseLabel(response.decision) : "No response recorded"}</strong>{item.organisationIds.length === 0 && " · Cohort item"}</p></article>; })}{potentialMeetings.map((meeting) => <article key={meeting.id} className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{meeting.institutionName}</p><p className="mt-1 text-xs text-slate-500">Potential Biz Meet · {meeting.proposedStartsAt ? format(new Date(meeting.proposedStartsAt), "d MMM yyyy, HH:mm") : "Time to arrange"}</p></div><span className={cn("shrink-0 rounded-full px-2 py-1 text-[10px] font-bold", meeting.status === "agreed" ? "bg-emerald-100 text-emerald-800" : meeting.status === "rejected" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800")}>{finalOnly ? "Finalised" : pretty(meeting.status)}</span></div><p className="mt-2 text-xs text-slate-600">Startup response: <strong>{responseLabel(meeting.decision)}</strong></p></article>)}{!scheduleItems.length && !potentialMeetings.length && <p className="p-8 text-center text-sm text-slate-500">No records in this view yet.</p>}</div></section>;
}

function AdminHubPage({ items, potentialMeetings, onOpenSchedule, onOpenInbox, onOpenMeetings, onOpenDecisions, onOpenReport, onOpenUpdates }: { items: ScheduleItem[]; potentialMeetings: PotentialMeeting[]; onOpenSchedule: () => void; onOpenInbox: () => void; onOpenMeetings: () => void; onOpenDecisions: () => void; onOpenReport: () => void; onOpenUpdates: () => void; }) {
  const pendingScheduleUpdates = items.flatMap((item) => item.responses).filter((response) => (response.decision !== "undecided" || response.note) && !response.adminReviewedAt).length;
  const pendingPotentialUpdates = potentialMeetings.filter((meeting) => meeting.decision !== "undecided" && !meeting.adminReviewedAt).length;
  const pendingActions = pendingScheduleUpdates + pendingPotentialUpdates;
  const inboxDescription = pendingActions
    ? `${pendingActions} update${pendingActions === 1 ? "" : "s"} need review (${pendingScheduleUpdates} schedule, ${pendingPotentialUpdates} Potential Biz Meet). Marking an update reviewed clears it from the working queue.`
    : "No company updates are waiting for review. New replies and messages will appear here automatically.";
  return <div>
    <p className="text-xs font-bold uppercase tracking-[.15em] text-indigo-600">Admin workspace</p>
    <section className="relative mt-1 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0e1c3d] via-[#162c5b] to-indigo-700 p-6 text-white shadow-[0_18px_45px_rgba(22,44,91,.18)] sm:p-8">
      <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full border-[24px] border-white/5" />
      <div className="relative max-w-3xl">
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-indigo-200">LVCN programme control centre</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Admin hub</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100">Choose a workspace below. Each one has a clear job: plan the programme, respond to company activity, or produce a reliable record.</p>
      </div>
      <div className="relative mt-6 grid gap-2 sm:grid-cols-3">
        <HubStat label="Schedule records" value={items.length} />
        <HubStat label="Potential Biz Meets" value={potentialMeetings.length} />
        <HubStat label="Updates to review" value={pendingActions} alert={pendingActions > 0} />
      </div>
    </section>
    <div className="mt-7 flex items-end justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-950">Workspaces</h2><p className="mt-1 text-sm text-slate-500">Start with the schedule, then follow the inbox when companies respond.</p></div><span className="hidden rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500 sm:inline">6 admin tools</span></div>
    <div className="mt-4 grid gap-4 lg:grid-cols-2"><AdminHubGuide number="01" title="Schedule" description="Create and update programme events, target them to the right startups, check dates, costs and conflicts, and control what companies can see." action="Open schedule" onOpen={onOpenSchedule} tone="indigo" /><AdminHubGuide number="02" title="Potential Biz Meets" description="Create one-to-one institutional opportunities, set the LVCN relationship status, and review each startup’s decision." action="Open Potential Biz Meets" onOpen={onOpenMeetings} tone="emerald" /><AdminHubGuide number="03" title="Action inbox" description={inboxDescription} action="Open action inbox" onOpen={onOpenInbox} tone={pendingActions ? "amber" : "slate"} /><AdminHubGuide number="04" title="Startup Updates" description="Send and review durable messages that remain visible outside an individual schedule decision." action="Open Startup Updates" onOpen={onOpenUpdates} tone="slate" /><AdminHubGuide number="05" title="Programme Record" description="Build a weekly snapshot for one startup, retain declined events for audit, and export a spreadsheet or calendar PDF." action="Open Programme Record" onOpen={onOpenReport} tone="slate" /><AdminHubGuide number="06" title="Cohort Retention" description="See how each company is responding and how consistently its invited users return to the programme board." action="Open Cohort Retention" onOpen={onOpenDecisions} tone="slate" /></div>
  </div>;
}

function HubStat({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) {
  return <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur"><p className={cn("text-2xl font-bold", alert && "text-amber-200")}>{value}</p><p className="mt-0.5 text-xs font-medium text-indigo-100">{label}</p></div>;
}

function AdminHubGuide({ number, title, description, action, onOpen, tone }: { number: string; title: string; description: string; action: string; onOpen: () => void; tone: "amber" | "emerald" | "indigo" | "slate"; }) {
  const styles = {
    amber: { card: "border-amber-200 bg-amber-50/70 hover:border-amber-300", icon: "bg-amber-100 text-amber-800", label: "Needs attention" },
    emerald: { card: "border-emerald-200 bg-emerald-50/60 hover:border-emerald-300", icon: "bg-emerald-100 text-emerald-800", label: "Relationships" },
    indigo: { card: "border-indigo-200 bg-indigo-50/70 hover:border-indigo-300", icon: "bg-indigo-100 text-indigo-800", label: "Plan the programme" },
    slate: { card: "border-slate-200 bg-white hover:border-indigo-200", icon: "bg-slate-100 text-slate-700", label: "Review and communicate" },
  }[tone];
  const Icon = title === "Schedule" ? CalendarDays : title === "Potential Biz Meets" ? Link2 : title === "Action inbox" ? Bell : title === "Startup Updates" ? CircleHelp : title === "Programme Record" ? FileDown : LayoutList;
  return <section className={cn("group flex min-h-52 flex-col rounded-2xl border p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg", styles.card)}><div className="flex items-start justify-between gap-3"><div className={cn("flex size-11 items-center justify-center rounded-2xl", styles.icon)}><Icon className="size-5" /></div><span className="text-xs font-bold tracking-[.12em] text-slate-400">{number}</span></div><p className="mt-4 text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">{styles.label}</p><h2 className="mt-1 text-xl font-semibold text-slate-950">{title}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p><Button type="button" variant={tone === "indigo" ? "indigo" : "secondary"} className="mt-5 self-start" onClick={onOpen}>{action}<ArrowRight className="ml-1.5 size-4 transition group-hover:translate-x-0.5" /></Button></section>;
}

// Legacy layout retained while existing internal links settle on the queue view.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function AdminInboxPage({ items, potentialMeetings, organisationNames, onReviewEvent, onReviewPotential, onOpenPotential }: { items: ScheduleItem[]; potentialMeetings: PotentialMeeting[]; organisationNames: Record<string, string>; onReviewEvent: (item: ScheduleItem, response: ScheduleItem["responses"][number]) => void; onReviewPotential: (meeting: PotentialMeeting) => void; onOpenPotential: () => void; }) {
  const eventUpdates = items.flatMap((item) => item.responses.filter((response) => (response.decision !== "undecided" || response.note) && !response.adminReviewedAt).map((response) => ({ item, response })));
  const potentialUpdates = potentialMeetings.filter((meeting) => meeting.decision !== "undecided" && !meeting.adminReviewedAt);
  const organisationName = (id: string) => organisationNames[id] ?? organisations.find((organisation) => organisation.id === id)?.name ?? "Unknown startup";
  return <div><p className="text-xs font-bold uppercase tracking-[.15em] text-indigo-600">Admin workspace</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Action inbox</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Only startup decisions and messages requiring LVCN follow-up appear here. Reviewing an item clears its badge; a later startup update returns it to the inbox.</p><div className="mt-6 grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">Schedule decisions & messages <Badge className="ml-2">{eventUpdates.length}</Badge></h2><div className="mt-4 space-y-3">{eventUpdates.map(({ item, response }) => <article key={`${item.id}-${response.organisationId}`} className="rounded-xl border border-slate-200 p-3"><p className="text-sm text-slate-800"><strong>{organisationName(response.organisationId)}</strong> {response.decision === "going" ? "confirmed" : response.decision === "pass" ? "rejected" : "updated"} <strong>{item.title}</strong>.</p>{response.note && <p className="mt-2 rounded-lg bg-indigo-50 p-2 text-sm text-indigo-950">“{response.note}”</p>}<Button size="sm" type="button" variant="secondary" className="mt-3" onClick={() => onReviewEvent(item, response)}>Mark reviewed</Button></article>)}{!eventUpdates.length && <p className="py-6 text-center text-sm text-slate-500">No new schedule decisions or messages.</p>}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">Potential Biz Meets <Badge className="ml-2">{potentialUpdates.length}</Badge></h2><div className="mt-4 space-y-3">{potentialUpdates.map((meeting) => <article key={meeting.id} className="rounded-xl border border-slate-200 p-3"><p className="text-sm text-slate-800"><strong>{organisationName(meeting.organisationId)}</strong> {meeting.decision === "going" ? "accepted" : "declined"} <strong>{meeting.institutionName}</strong>.</p><div className="mt-3 flex gap-2"><Button size="sm" type="button" variant="secondary" onClick={onOpenPotential}>Open potential meet</Button><Button size="sm" type="button" variant="ghost" onClick={() => onReviewPotential(meeting)}>Mark reviewed</Button></div></article>)}{!potentialUpdates.length && <p className="py-6 text-center text-sm text-slate-500">No new Potential Biz Meet decisions.</p>}</div></section></div></div>;
}

function AdminInboxQueuePage({ items, potentialMeetings, availability, organisationNames, onReplyEvent, onResolveEvent, onReviewPotential, onReviewAvailability, onOpenPotential }: { items: ScheduleItem[]; potentialMeetings: PotentialMeeting[]; availability: AvailabilityBlock[]; organisationNames: Record<string, string>; onReplyEvent: (item: ScheduleItem, response: ScheduleItem["responses"][number], body: string, status: AdminResponseStatus) => void; onResolveEvent: (item: ScheduleItem, response: ScheduleItem["responses"][number]) => void; onReviewPotential: (meeting: PotentialMeeting) => void; onReviewAvailability: (block: AvailabilityBlock) => void; onOpenPotential: () => void; }) {
  const [filter, setFilter] = useState<"all" | "accepted" | "declined" | "messages" | "availability">("all");
  const [replying, setReplying] = useState<{ item: ScheduleItem; response: ScheduleItem["responses"][number] }>();
  const organisationName = (id: string) => organisationNames[id] ?? organisations.find((organisation) => organisation.id === id)?.name ?? "Unknown startup";
  const eventUpdates = items.flatMap((item) => item.responses.filter((response) => response.conversationStatus === "awaiting_admin" || ((response.decision !== "undecided" || response.note) && !response.adminReviewedAt)).map((response) => ({ item, response })));
  const potentialUpdates = potentialMeetings.filter((meeting) => meeting.decision !== "undecided" && !meeting.adminReviewedAt);
  const accepted = eventUpdates.filter(({ response }) => response.decision === "going").length + potentialUpdates.filter((meeting) => meeting.decision === "going").length;
  const declined = eventUpdates.filter(({ response }) => response.decision === "pass").length + potentialUpdates.filter((meeting) => meeting.decision === "pass").length;
  const messages = eventUpdates.filter(({ response }) => Boolean(response.note) && response.decision === "undecided").length;
  const availabilityUpdates = availability.filter((block) => !block.adminReviewedAt);
  const matches = (decision: Decision, note?: string) => filter === "all" || (filter === "accepted" && decision === "going") || (filter === "declined" && decision === "pass") || (filter === "messages" && decision === "undecided" && Boolean(note));
  const visibleEvents = eventUpdates.filter(({ response }) => matches(response.decision, response.note));
  const visiblePotential = potentialUpdates.filter((meeting) => matches(meeting.decision));
  const visibleAvailability = filter === "all" || filter === "availability" ? availabilityUpdates : [];
  const reviewableCount = visiblePotential.length + visibleAvailability.length;
  const reviewVisible = () => {
    visiblePotential.forEach((meeting) => void onReviewPotential(meeting));
    visibleAvailability.forEach((block) => void onReviewAvailability(block));
  };
  const filterOptions: { id: typeof filter; label: string; count: number; className: string }[] = [
    { id: "all", label: "All updates", count: eventUpdates.length + potentialUpdates.length + availabilityUpdates.length, className: "border-slate-900 bg-slate-900 text-white" },
    { id: "accepted", label: "Accepted", count: accepted, className: "border-emerald-600 bg-emerald-600 text-white" },
    { id: "declined", label: "Declined", count: declined, className: "border-rose-600 bg-rose-600 text-white" },
    { id: "messages", label: "Messages", count: messages, className: "border-indigo-600 bg-indigo-600 text-white" },
    { id: "availability", label: "Company availability", count: availabilityUpdates.length, className: "border-amber-600 bg-amber-600 text-white" },
  ];
  const toneFor = (decision: Decision) => decision === "going" ? { card: "border-emerald-200 bg-emerald-50/70", badge: "bg-emerald-100 text-emerald-800", label: "Accepted" } : decision === "pass" ? { card: "border-rose-200 bg-rose-50/70", badge: "bg-rose-100 text-rose-800", label: "Declined" } : { card: "border-indigo-200 bg-indigo-50/70", badge: "bg-indigo-100 text-indigo-800", label: "Message" };
  return <div>
    <p className="text-xs font-bold uppercase tracking-[.15em] text-indigo-600">Admin workspace</p>
    <h1 className="mt-1 text-3xl font-semibold tracking-tight">Action inbox</h1>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Use this queue for updates that need attention. Resolve routine accepts or declines without messaging; reply only when the startup has asked a question or needs a specific follow-up.</p>
    <div className="mt-5 flex flex-wrap items-center gap-2">{filterOptions.map((option) => <button key={option.id} type="button" onClick={() => setFilter(option.id)} className={cn("rounded-full border px-3 py-1.5 text-xs font-bold", filter === option.id ? option.className : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}>{option.label} <span className="ml-1">{option.count}</span></button>)}{reviewableCount > 1 && <Button type="button" variant="secondary" className="ml-auto" onClick={reviewVisible}>Mark {reviewableCount} shown as reviewed</Button>}</div>
    <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">Schedule decisions & messages <Badge className="ml-2">{visibleEvents.length}</Badge></h2><p className="mt-1 text-xs leading-5 text-slate-500">Routine decisions can be acknowledged without messaging. Reply only when a response is needed.</p><div className="mt-4 max-h-[34rem] space-y-3 overflow-y-auto pr-1">{visibleEvents.map(({ item, response }) => { const tone = toneFor(response.decision); const plan = response.attendancePlan && response.attendancePlan !== "not_set" ? response.attendancePlan.replace("_", " ") : "attendance not specified"; const needsReply = response.conversationStatus === "awaiting_admin" || Boolean(response.note); return <article key={`${item.id}-${response.organisationId}`} className={cn("rounded-xl border p-3", tone.card)}><div className="flex items-start justify-between gap-3"><p className="text-sm text-slate-800"><strong>{organisationName(response.organisationId)}</strong> <strong>{item.title}</strong></p><span className={cn("shrink-0 rounded-full px-2 py-1 text-[10px] font-bold", tone.badge)}>{tone.label}</span></div><p className="mt-2 text-xs font-semibold capitalize text-slate-600">Plan: {plan}{response.attendanceStartsAt && ` · ${format(new Date(response.attendanceStartsAt), "d MMM, HH:mm")}`}{response.attendanceEndsAt && `–${format(new Date(response.attendanceEndsAt), "HH:mm")}`}</p>{response.messages?.slice(-2).map((message) => <p key={message.id} className="mt-2 rounded-lg bg-white/80 p-2 text-sm text-indigo-950"><strong>{message.authorRole === "lvnc_admin" ? "LVCN" : organisationName(response.organisationId)}:</strong> {message.body}</p>)}{!response.messages?.length && response.note && <p className="mt-2 rounded-lg bg-white/80 p-2 text-sm text-indigo-950">“{response.note}”</p>}<div className="mt-3 flex flex-wrap gap-2"><Button size="sm" type="button" variant="secondary" title="Marks this item reviewed without sending a reply" onClick={() => onResolveEvent(item, response)}>Acknowledge</Button><Button size="sm" type="button" variant="indigo" onClick={() => setReplying({ item, response })}>{needsReply ? "Reply & resolve" : "Reply (optional)"}</Button></div></article>; })}{!visibleEvents.length && <p className="py-6 text-center text-sm text-slate-500">No schedule updates match this view.</p>}</div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">Potential Biz Meets <Badge className="ml-2">{visiblePotential.length}</Badge></h2><div className="mt-4 max-h-[34rem] space-y-3 overflow-y-auto pr-1">{visiblePotential.map((meeting) => { const tone = toneFor(meeting.decision); return <article key={meeting.id} className={cn("rounded-xl border p-3", tone.card)}><div className="flex items-start justify-between gap-3"><p className="text-sm text-slate-800"><strong>{organisationName(meeting.organisationId)}</strong> <strong>{meeting.institutionName}</strong></p><span className={cn("shrink-0 rounded-full px-2 py-1 text-[10px] font-bold", tone.badge)}>{tone.label}</span></div><p className="mt-2 text-xs text-slate-600">{meeting.decision === "going" ? "Allocate a suitable free slot, then confirm the meeting." : "Review the decline and adjust the outreach plan if needed."}</p><div className="mt-3 flex gap-2"><Button size="sm" type="button" variant="secondary" onClick={onOpenPotential}>Open potential meet</Button><Button size="sm" type="button" variant="ghost" title="Marks this item reviewed without sending a reply" onClick={() => onReviewPotential(meeting)}>Acknowledge</Button></div></article>; })}{!visiblePotential.length && <p className="py-6 text-center text-sm text-slate-500">No Potential Biz Meet updates match this view.</p>}</div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2"><h2 className="font-semibold">Company availability <Badge className="ml-2">{visibleAvailability.length}</Badge></h2><div className="mt-4 max-h-[24rem] space-y-3 overflow-y-auto pr-1">{visibleAvailability.map((block) => <article key={block.id} className="rounded-xl border border-amber-200 bg-amber-50/70 p-3"><div className="flex items-start justify-between gap-3"><p className="text-sm text-slate-800"><strong>{organisationName(block.organisationId)}</strong> blocked <strong>{block.title}</strong>.</p><span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">Availability</span></div><p className="mt-2 text-xs text-slate-700">{dateLabel({ startsAt: block.startsAt, endsAt: block.endsAt, timePrecision: "exact" } as ScheduleItem)}</p>{block.note && <p className="mt-2 rounded-lg bg-white/80 p-2 text-sm text-slate-800">“{block.note}”</p>}<Button size="sm" type="button" variant="secondary" className="mt-3" title="Marks this item reviewed without sending a reply" onClick={() => onReviewAvailability(block)}>Acknowledge</Button></article>)}{!visibleAvailability.length && <p className="py-6 text-center text-sm text-slate-500">No company-availability alerts match this view.</p>}</div></section>
    </div>
    {replying && <ScheduleReplyDialog item={replying.item} response={replying.response} organisationName={organisationName(replying.response.organisationId)} onClose={() => setReplying(undefined)} onSend={(body, status) => { onReplyEvent(replying.item, replying.response, body, status); setReplying(undefined); }} />}
  </div>;
}

function ScheduleReplyDialog({ item, response, organisationName, onClose, onSend }: { item: ScheduleItem; response: ScheduleItem["responses"][number]; organisationName: string; onClose: () => void; onSend: (body: string, status: AdminResponseStatus) => void; }) {
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<AdminResponseStatus>("approved");
  return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent><DialogTitle>Reply to {organisationName}</DialogTitle><DialogDescription>Your reply is visible to the startup in this event’s conversation. It is the action that closes the admin queue item.</DialogDescription><div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700"><p><strong>{item.title}</strong></p><p className="mt-1 capitalize">Requested plan: {response.attendancePlan?.replace("_", " ") ?? "Not specified"}</p>{response.attendanceStartsAt && <p className="mt-1">Requested time: {format(new Date(response.attendanceStartsAt), "EEE d MMM, HH:mm")}{response.attendanceEndsAt && `–${format(new Date(response.attendanceEndsAt), "HH:mm")}`}</p>}</div><label className="mt-4 block"><FieldLabel>Response outcome</FieldLabel><Select value={status} onChange={(event) => setStatus(event.target.value as AdminResponseStatus)}><option value="approved">Approved / understood</option><option value="needs_details">Ask for more detail</option><option value="not_possible">Not possible</option><option value="information">Information shared</option></Select></label><label className="mt-4 block"><FieldLabel>Message to startup</FieldLabel><textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder={status === "needs_details" ? "What time, constraint or detail do you need from the startup?" : "Give the startup a clear next step or confirmation."} className="mt-1 min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></label><div className="mt-5 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" variant="indigo" disabled={!body.trim()} onClick={() => onSend(body.trim(), status)}>{status === "needs_details" ? "Send question" : "Send response & resolve"}</Button></div></DialogContent></Dialog>;
}

// Retained for the legacy meeting layout while the consolidated table settles.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function PotentialMeetingContextTable({ meetings, organisationName, hiddenColumns, isAdmin }: { meetings: PotentialMeeting[]; organisationName: (id: string) => string; hiddenColumns: string[]; isAdmin: boolean }) {
  const showWhy = isAdmin || !hiddenColumns.includes("why");
  const showNext = isAdmin || !hiddenColumns.includes("next");
  if (!showWhy && !showNext) return null;
  return <section className="mt-5 overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50/40"><div className="border-b border-indigo-100 px-4 py-3"><h2 className="text-sm font-bold text-indigo-950">Startup context</h2><p className="mt-1 text-xs text-indigo-800">Short explanations help each company understand why an introduction matters and what to do next.</p></div><div className="overflow-x-auto"><table className="min-w-[760px] w-full table-fixed text-left text-sm"><thead className="bg-indigo-900 text-[11px] font-bold text-white"><tr><th className="w-56 px-4 py-3">Institution</th>{isAdmin && <th className="w-40 px-4 py-3">Startup</th>}{showWhy && <th className="px-4 py-3">Why this is relevant</th>}{showNext && <th className="px-4 py-3">Next step</th>}</tr></thead><tbody className="divide-y divide-indigo-100 bg-white">{meetings.map((meeting) => <tr key={meeting.id}><td className="px-4 py-3 font-semibold text-slate-900">{meeting.institutionName}<span className="mt-1 block text-[11px] font-normal text-slate-400">{meetingCategoryLabel(meeting.category)}</span></td>{isAdmin && <td className="px-4 py-3 text-xs text-slate-600">{organisationName(meeting.organisationId)}</td>}{showWhy && <td className="px-4 py-3 text-xs leading-5 text-slate-700">{meeting.startupVisibleNote || <span className="italic text-slate-400">Not yet written</span>}</td>}{showNext && <td className="px-4 py-3 text-xs leading-5 text-slate-700">{meeting.nextAction || <span className="italic text-slate-400">Not yet set</span>}</td>}</tr>)}</tbody></table></div></section>;
}

function BusinessMeetingsPage({
  meetings,
  scheduleItems,
  availability,
  organisationNames,
  hiddenColumns,
  onColumnVisibilityChange,
  isAdmin,
  isPartnerObserver,
  onSave,
  onDelete,
  onDecision,
  onReview,
  language,
}: {
  meetings: PotentialMeeting[];
  scheduleItems: ScheduleItem[];
  availability: AvailabilityBlock[];
  organisationNames: Record<string, string>;
  hiddenColumns: string[];
  onColumnVisibilityChange: (columnId: string, visible: boolean) => void;
  isAdmin: boolean;
  isPartnerObserver: boolean;
  onSave: (meeting: PotentialMeeting) => void;
  onDelete: (meeting: PotentialMeeting) => void;
  onDecision: (meeting: PotentialMeeting, decision: Decision, priorityRating?: 1 | 2 | 3) => void;
  onReview: (meeting: PotentialMeeting) => void;
  language: Language;
}) {
  const copy = language === "ko" ? koreanUiText : uiText.en;
  const canRespond = !isAdmin && !isPartnerObserver;
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<PotentialMeeting>();
  const [decisionMeeting, setDecisionMeetingState] = useState<PotentialMeeting>();
  const setDecisionMeeting = (meeting?: PotentialMeeting) => { if (meeting && !canRespond) return; setDecisionMeetingState(meeting); };
  const [priorityRating, setPriorityRating] = useState<1 | 2 | 3>(2);
  const [allocating, setAllocating] = useState<PotentialMeeting>();
  const [selectedOrganisationIds, setSelectedOrganisationIds] = useState<string[]>([]);
  const [selectedObserverOrganisation, setSelectedObserverOrganisation] = useState("all");
  const [outreachFilter, setOutreachFilter] = useState<"all" | PotentialMeeting["status"]>("all");
  const [decisionFilter, setDecisionFilter] = useState<"all" | Decision>("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"institution" | "startup" | "status" | "decision">("institution");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const organisationName = (id: string) => organisationNames[id] ?? organisations.find((organisation) => organisation.id === id)?.name ?? "Unknown startup";
  const companyOptions = Array.from(new Set(meetings.map((meeting) => meeting.organisationId))).map((id) => ({ id, name: organisationName(id) })).sort((a, b) => a.name.localeCompare(b.name));
  const categoryOptions = Array.from(new Set(meetings.map((meeting) => meetingCategoryLabel(meeting.category)).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const visibleMeetings = meetings.filter((meeting) => {
    const displayCategory = meetingCategoryLabel(meeting.category);
    const matchesSearch = [meeting.institutionName, organisationName(meeting.organisationId), meeting.category, displayCategory, meeting.status, meeting.startupVisibleNote, meeting.nextAction, ...(isAdmin ? [meeting.contactName, meeting.contactEmail, meeting.internalNote] : [])].filter(Boolean).join(" ").toLowerCase().includes(query.trim().toLowerCase());
    return matchesSearch && (selectedCategories.length === 0 || selectedCategories.includes(displayCategory)) && ((isAdmin && (selectedOrganisationIds.length === 0 || selectedOrganisationIds.includes(meeting.organisationId))) || (isPartnerObserver && (selectedObserverOrganisation === "all" || selectedObserverOrganisation === meeting.organisationId)) || (!isAdmin && !isPartnerObserver && meeting.organisationId === meeting.organisationId)) && (outreachFilter === "all" || meeting.status === outreachFilter) && (decisionFilter === "all" || meeting.decision === decisionFilter);
  }).sort((a, b) => {
    if (sortBy === "decision") {
      const rank = (decision: Decision) => decision === "going" ? 0 : decision === "pass" ? 1 : 2;
      return (rank(a.decision) - rank(b.decision)) * (sortDirection === "asc" ? 1 : -1);
    }
    const values = sortBy === "institution" ? [a.institutionName, b.institutionName] : sortBy === "startup" ? [organisationName(a.organisationId), organisationName(b.organisationId)] : [a.status, b.status];
    return values[0].localeCompare(values[1]) * (sortDirection === "asc" ? 1 : -1);
  });
  const statusStyle = (status: PotentialMeeting["status"]) => status === "agreed" ? "bg-emerald-100 text-emerald-800" : status === "rejected" ? "bg-rose-100 text-rose-800" : status === "paused" ? "bg-slate-200 text-slate-700" : status === "contacted" ? "bg-amber-100 text-amber-800" : "bg-indigo-100 text-indigo-800";
  const categoryStyle = (category: string) => { const value = meetingCategoryLabel(category).toLowerCase(); return value.includes("invest") ? "text-sky-700" : value.includes("corporate") ? "text-cyan-700" : value.includes("regulation") ? "text-amber-700" : value.includes("health") || value.includes("medical") ? "text-fuchsia-700" : value.includes("academic") || value.includes("research") ? "text-violet-700" : "text-emerald-700"; };
  function decisionLabel(decision: Decision) { return decision === "going" ? "Accepted" : decision === "pass" ? "Rejected" : "Pending"; }
  const blankMeeting = (): PotentialMeeting => ({ id: crypto.randomUUID(), organisationId: companyOptions[0]?.id ?? organisations[0]?.id ?? "", institutionName: "", category: "Other", status: "draft", decision: "undecided" });
  const inbox = meetings.filter((meeting) => meeting.decision !== "undecided" && !meeting.adminReviewedAt);
  const ratedMeetings = meetings.filter((meeting) => meeting.priorityRating).sort((a, b) => (b.priorityRating ?? 0) - (a.priorityRating ?? 0));
  const visibilityControls = isAdmin ? <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2"><span className="mr-1 text-xs font-bold text-slate-500">Visible columns</span>{[{ id: "institution", label: "Institution" }, { id: "startup", label: "Startup" }, { id: "category", label: "Category" }, { id: "time", label: "Proposed time" }, { id: "status", label: "LVCN status" }, { id: "decision", label: "Startup decision" }, { id: "priority", label: "Priority" }, { id: "why", label: "Why relevant" }, { id: "next", label: "Next step" }].map((column) => { const visible = !hiddenColumns.includes(column.id); return <button key={column.id} type="button" onClick={() => onColumnVisibilityChange(column.id, !visible)} className={cn("inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold", visible ? "bg-slate-100 text-slate-700" : "text-slate-400 line-through")} title={visible ? `Hide ${column.label}` : `Show ${column.label}`}>{visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}{column.label}</button>; })}</div> : null;
  useEffect(() => {
    const table = document.querySelector("table.min-w-\\[900px\\]");
    if (!table) return;
    const indexes: Record<string, number> = isAdmin ? { institution: 1, startup: 2, category: 3, time: 4, status: 5, decision: 6, why: 7, next: 8 } : { institution: 1, category: 2, time: 3, status: 4, decision: 5, why: 6, next: 7 };
    Object.entries(indexes).forEach(([id, index]) => table.querySelectorAll(`tr > :nth-child(${index})`).forEach((cell) => { (cell as HTMLElement).style.display = !isAdmin && hiddenColumns.includes(id) ? "none" : ""; }));
    table.querySelectorAll("[data-context-column]").forEach((cell) => cell.remove());
    const headerCells = table.querySelector("thead tr");
    if (headerCells) {
      const decisionHeader = headerCells.children[isAdmin ? 5 : 4];
      const whyHeader = document.createElement("th");
      whyHeader.dataset.contextColumn = "why";
      whyHeader.className = "w-64 px-4 py-3";
      whyHeader.textContent = language === "ko" ? "관련성" : "Why this is relevant";
      decisionHeader?.insertAdjacentElement("afterend", whyHeader);
    }
    const bodyRows = Array.from(table.querySelectorAll("tbody tr")).filter((row) => !row.querySelector("[colspan]"));
    bodyRows.forEach((row, index) => {
      const meeting = visibleMeetings[index];
      if (!meeting) return;
      const decisionCell = row.children[isAdmin ? 5 : 4];
      const whyCell = document.createElement("td");
      whyCell.dataset.contextColumn = "why";
      whyCell.className = "px-4 py-3 text-xs leading-5 text-slate-600";
      whyCell.textContent = potentialMeetingRelevance(meeting, language) || "Not yet written";
      decisionCell?.insertAdjacentElement("afterend", whyCell);
    });
    table.querySelectorAll("[data-context-column='why']").forEach((cell) => { (cell as HTMLElement).style.display = isAdmin || !hiddenColumns.includes("why") ? "" : "none"; });
    const nextColumnIndex = isAdmin ? 8 : 7;
    table.querySelectorAll(`tr > :nth-child(${nextColumnIndex})`).forEach((cell) => { (cell as HTMLElement).style.display = isAdmin || !hiddenColumns.includes("next") ? "" : "none"; });
    const categoryColumnIndex = isAdmin ? 3 : 2;
    table.querySelectorAll(`tr > :nth-child(${categoryColumnIndex})`).forEach((cell) => { (cell as HTMLElement).style.width = "9rem"; });
    const institutionColumnIndex = 1;
    table.querySelectorAll(`tr > :nth-child(${institutionColumnIndex})`).forEach((cell) => { (cell as HTMLElement).style.width = "12rem"; });
  }, [hiddenColumns, isAdmin, language, visibleMeetings]);
  return <div>{visibilityControls}
    <p className="text-xs font-bold uppercase tracking-[.15em] text-indigo-600">Schedule / Business relationships</p>
    <div className="mt-1 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-semibold tracking-tight">{copy.businessMeetings}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Startup-specific introductions and potential partnerships. Contact details and internal coordination notes are visible only to LVCN admins.</p></div>{isAdmin && <Button type="button" variant="indigo" onClick={() => setEditing(blankMeeting())}><Plus className="mr-1.5 size-4" />Add Potential Biz Meet</Button>}</div>
    {isPartnerObserver && <section className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4"><FieldLabel>View Potential Biz Meets for</FieldLabel><Select className="mt-2 max-w-sm" value={selectedObserverOrganisation} onChange={(event) => setSelectedObserverOrganisation(event.target.value)}><option value="all">All startups</option>{companyOptions.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</Select><p className="mt-2 text-xs text-indigo-900">Read-only partner view. Choose a startup to focus its published opportunities.</p></section>}
    {isAdmin && <details open className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 text-sm text-indigo-950"><summary className="cursor-pointer font-semibold">Admin workflow</summary><p className="mt-2 leading-6">Create one row per startup, institution and contact. The startup-visible note is safe for the company to read; contact details and internal notes stay private.</p></details>}
    {isAdmin && ratedMeetings.length > 0 && <section className="mt-5 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50"><div className="p-4"><h2 className="font-semibold text-amber-950">Startup outreach priorities</h2><p className="mt-1 text-xs text-amber-900">Highest-rated institutions first. One star is low priority; three stars is high priority.</p></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-amber-100 text-xs font-bold text-amber-950"><tr><th className="px-4 py-2">Startup</th><th className="px-4 py-2">Institution</th><th className="px-4 py-2">Priority rating</th></tr></thead><tbody className="divide-y divide-amber-100 bg-white">{ratedMeetings.map((meeting) => <tr key={meeting.id}><td className="px-4 py-2 text-slate-700">{organisationName(meeting.organisationId)}</td><td className="px-4 py-2 font-semibold text-slate-900">{meeting.institutionName}</td><td className="px-4 py-2 font-bold tracking-wide text-amber-600">{"★".repeat(meeting.priorityRating!)}</td></tr>)}</tbody></table></div></section>}
    {isAdmin && inbox.length > 0 && <section className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-amber-800">Admin action inbox</p><h2 className="mt-1 text-lg font-semibold text-amber-950">{inbox.length} startup {inbox.length === 1 ? "decision needs" : "decisions need"} your follow-up</h2></div><AlertTriangle className="size-6 text-amber-700" /></div><div className="mt-3 space-y-2">{inbox.map((meeting) => <div key={meeting.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-white px-3 py-2"><p className="text-sm text-slate-700"><strong>{organisationName(meeting.organisationId)}</strong> {meeting.decision === "going" ? "accepted" : "declined"} <strong>{meeting.institutionName}</strong>. {meeting.decision === "going" ? "Allocate a suitable free slot, then confirm the meeting." : "Review the decline and adjust the outreach plan if needed."}</p><div className="flex gap-2"><Button size="sm" type="button" variant="secondary" onClick={() => setEditing(meeting)}>{meeting.decision === "going" ? "Allocate" : "Review"}</Button><Button size="sm" type="button" variant="ghost" onClick={() => onReview(meeting)}>Mark reviewed</Button></div></div>)}</div></section>}
    {isAdmin && meetings.some((meeting) => meeting.decision === "going" && !meeting.proposedStartsAt) && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"><strong>Ready to schedule:</strong> {meetings.filter((meeting) => meeting.decision === "going" && !meeting.proposedStartsAt).map((meeting) => <button key={meeting.id} type="button" className="ml-2 font-bold text-emerald-800 underline" onClick={() => setAllocating(meeting)}>{meeting.institutionName} ({organisationName(meeting.organisationId)})</button>)}</div>}
    {isAdmin && <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4"><div className="flex flex-wrap items-end gap-3"><div className="min-w-64 flex-1"><p className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">Companies</p><div className="mt-2 flex max-h-28 flex-wrap gap-2 overflow-y-auto pr-1">{companyOptions.map((company) => <label key={company.id} className={cn("cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold", selectedOrganisationIds.includes(company.id) ? "border-indigo-300 bg-indigo-50 text-indigo-800" : "border-slate-200 bg-white text-slate-600")}><input className="sr-only" type="checkbox" checked={selectedOrganisationIds.includes(company.id)} onChange={() => setSelectedOrganisationIds((current) => current.includes(company.id) ? current.filter((id) => id !== company.id) : [...current, company.id])} />{company.name}</label>)}</div><button type="button" className="mt-2 text-xs font-bold text-indigo-700 hover:underline" onClick={() => setSelectedOrganisationIds([])}>{selectedOrganisationIds.length ? "Show all companies" : "All companies selected"}</button></div><label className="min-w-40"><FieldLabel>LVCN outreach</FieldLabel><Select value={outreachFilter} onChange={(event) => setOutreachFilter(event.target.value as "all" | PotentialMeeting["status"])}><option value="all">All outreach states</option>{["draft", "contacted", "agreed", "rejected", "paused"].map((status) => <option key={status} value={status}>{pretty(status)}</option>)}</Select></label><label className="min-w-40"><FieldLabel>Startup response</FieldLabel><Select value={decisionFilter} onChange={(event) => setDecisionFilter(event.target.value as "all" | Decision)}><option value="all">All responses</option><option value="undecided">Pending</option><option value="going">Accepted</option><option value="pass">Rejected</option></Select></label></div><p className="mt-3 text-xs leading-5 text-slate-500"><strong>LVCN outreach</strong> is our relationship progress (draft, contacted, agreed). <strong>Startup response</strong> is the company’s choice (pending, accepted or rejected).</p></section>}
    {isAdmin && <div className="mt-3 flex flex-wrap items-end gap-2"><label className="w-56"><FieldLabel>Sort rows by</FieldLabel><Select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)}><option value="institution">Institution (A to Z)</option><option value="startup">Startup (A to Z)</option><option value="decision">Startup decision</option></Select></label>{sortBy === "decision" && <Button type="button" variant="secondary" onClick={() => setSortDirection((current) => current === "asc" ? "desc" : "asc")}>{sortDirection === "asc" ? "Accepted first" : "Pending first"}</Button>}</div>}
    {!isAdmin && <div className="mt-4 flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-3"><label className="w-52"><FieldLabel>Order opportunities</FieldLabel><Select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)}><option value="institution">Institution A–Z</option><option value="decision">Response status</option><option value="status">LVCN outreach status</option></Select></label>{sortBy === "decision" && <Button type="button" variant="secondary" onClick={() => setSortDirection((current) => current === "asc" ? "desc" : "asc")}>{sortDirection === "asc" ? "Confirmed first" : "Pending first"}</Button>}</div>}
    {canRespond && <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm leading-6 text-indigo-950"><strong>Next step:</strong> click an opportunity below, give the mentor or institution a 1–3 star priority rating, then choose <strong>Accept</strong> if you would like to speak with them or <strong>Reject</strong> if you do not. Your choices help LVCN prioritise outreach.</div>}
    <details className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-slate-700">
        <span className="flex items-center gap-2"><Filter className="size-4 text-indigo-600" />{language === "ko" ? "카테고리 및 검색 필터" : "Category and search filters"}{selectedCategories.length > 0 && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] text-indigo-700">{selectedCategories.length} selected</span>}</span>
        <ChevronDown className="size-4 text-slate-400 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-4 flex flex-wrap items-center gap-2"><span className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">{language === "ko" ? "카테고리" : "Filter by category"}</span><button type="button" onClick={() => setSelectedCategories([])} className={cn("rounded-full border px-3 py-1.5 text-xs font-bold", selectedCategories.length === 0 ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-600")}>{language === "ko" ? "전체" : "All"}</button>{categoryOptions.map((category) => <button key={category} type="button" onClick={() => setSelectedCategories((current) => current.includes(category) ? current.filter((value) => value !== category) : [...current, category])} className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold", selectedCategories.includes(category) ? "border-indigo-300 bg-indigo-50 text-indigo-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}>{category}</button>)}</div><p className="mt-2 text-xs text-slate-500">{language === "ko" ? "여러 카테고리를 동시에 선택할 수 있습니다." : "Select one or several categories; choose All to clear the filter."}</p><div className="relative mt-3"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder={isAdmin ? "Search institution, startup, contact or note" : "Search your potential meetings"} /></div>
    </details>
    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.03)]"><div className="overflow-x-auto"><table className="min-w-[900px] w-full table-fixed text-left text-sm"><thead className="bg-[#286c58] text-[11px] font-bold text-white"><tr><th className="w-52 px-4 py-3">Institution</th>{isAdmin && <th className="w-40 px-4 py-3">Startup</th>}<th className="w-28 px-4 py-3">Category</th><th className="w-32 px-4 py-3">Proposed time</th><th className="w-28 px-4 py-3">LVCN status</th><th className="w-28 px-4 py-3">Startup decision</th><th className="px-4 py-3">Next step</th></tr></thead><tbody className="divide-y divide-slate-100">{visibleMeetings.map((meeting) => <tr key={meeting.id} onClick={() => isAdmin ? setEditing(meeting) : setDecisionMeeting(meeting)} className="cursor-pointer odd:bg-white even:bg-slate-50/70 hover:bg-indigo-50"><td className="px-4 py-3">{meeting.externalUrl ? <a onClick={(event) => event.stopPropagation()} href={meeting.externalUrl} target="_blank" rel="noreferrer" title={`Open ${meeting.institutionName} in a new tab`} className="inline-flex max-w-full items-center gap-1 font-semibold text-indigo-700 hover:underline"><span className="truncate">{meeting.institutionName}</span><ExternalLink className="size-3.5 shrink-0" /></a> : <p className="truncate font-semibold text-slate-900">{meeting.institutionName}</p>}<p className="mt-1 text-[11px] text-slate-400">{meeting.externalUrl ? "Open website" : "No website added"}</p></td>{isAdmin && <td className="truncate px-4 py-3 text-slate-600">{organisationName(meeting.organisationId)}</td>}<td className={cn("truncate px-4 py-3 font-semibold", categoryStyle(meeting.category))}>{meetingCategoryLabel(meeting.category)}</td><td className="px-4 py-3 text-xs text-slate-600">{meeting.proposedStartsAt ? <>{format(new Date(meeting.proposedStartsAt), "d MMM, HH:mm")}{meeting.proposedEndsAt && <> – {format(new Date(meeting.proposedEndsAt), "HH:mm")}</>}</> : "To arrange"}</td><td className="px-4 py-3"><span className={cn("rounded-md px-2 py-1 text-[10px] font-bold", statusStyle(meeting.status))}>{pretty(meeting.status)}</span></td><td className="px-4 py-3">{isAdmin ? <span className={cn("inline-block rounded-md px-2 py-1 text-xs font-bold", meeting.decision === "undecided" ? "urgent-attention" : "text-slate-700")}>{decisionLabel(meeting.decision)}</span> : <button type="button" onClick={(event) => { event.stopPropagation(); setDecisionMeeting(meeting); }} className={cn("rounded-md px-2.5 py-1 text-[10px] font-bold", meeting.decision === "going" ? "bg-emerald-100 text-emerald-800" : meeting.decision === "pass" ? "bg-rose-100 text-rose-800" : "urgent-attention")}>{decisionLabel(meeting.decision)}</button>}</td><td className="px-4 py-3 text-xs leading-5 text-slate-600"><span className="line-clamp-2">{meeting.nextAction ?? meeting.startupVisibleNote ?? "—"}</span></td></tr>)}</tbody></table></div>{!visibleMeetings.length && <p className="p-8 text-center text-sm text-slate-500">No potential business meetings are currently visible.</p>}</div>
    {editing && <PotentialMeetingEditor meeting={editing} onClose={() => setEditing(undefined)} onSave={(meeting) => { onSave(meeting); setEditing(undefined); }} onDelete={(meeting) => { onDelete(meeting); setEditing(undefined); }} />}
    {allocating && <PotentialMeetingAllocation meeting={allocating} scheduleItems={scheduleItems} availability={availability} onClose={() => setAllocating(undefined)} onSave={(meeting) => { onSave(meeting); onReview(meeting); setAllocating(undefined); }} />}
    {decisionMeeting && <Dialog open onOpenChange={(open) => !open && setDecisionMeeting(undefined)}><DialogContent><DialogTitle>{decisionMeeting.institutionName}</DialogTitle><DialogDescription>Review the opportunity, then choose the response that is right for your startup.</DialogDescription><div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{decisionMeeting.proposedStartsAt && <p><strong>Proposed time:</strong> {format(new Date(decisionMeeting.proposedStartsAt), "EEE d MMM, HH:mm")}{decisionMeeting.proposedEndsAt && <> – {format(new Date(decisionMeeting.proposedEndsAt), "HH:mm")}</>}</p>}{decisionMeeting.location && <p><strong>Location:</strong> {decisionMeeting.location}</p>}{decisionMeeting.startupVisibleNote && <p><strong>Why this is relevant:</strong> {decisionMeeting.startupVisibleNote}</p>}{decisionMeeting.nextAction && <p><strong>Next step:</strong> {decisionMeeting.nextAction}</p>}{decisionMeeting.externalUrl && <a className="inline-flex font-semibold text-indigo-700 hover:underline" href={decisionMeeting.externalUrl} target="_blank" rel="noreferrer">Open institution website <ExternalLink className="ml-1 mt-0.5 size-3.5" /></a>}</div><div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-bold text-amber-950">How important is this institution?</p><p className="mt-1 text-xs text-amber-900">Your rating helps LVCN prioritise outreach: 1 = low, 3 = high.</p><div className="mt-3 flex gap-2">{([1, 2, 3] as const).map((rating) => <button key={rating} type="button" onClick={() => setPriorityRating(rating)} aria-label={`${rating} star priority`} className={cn("rounded-lg border px-3 py-2 text-lg", priorityRating === rating ? "border-amber-500 bg-amber-100 text-amber-600" : "border-amber-200 bg-white text-slate-300")}>{"★".repeat(rating)}</button>)}</div></div><div className="mt-5 flex flex-wrap gap-2"><Button type="button" variant="indigo" onClick={() => { onDecision(decisionMeeting, "going", priorityRating); setDecisionMeeting(undefined); }}>Accept</Button><Button type="button" variant="outline" onClick={() => { onDecision(decisionMeeting, "undecided", priorityRating); setDecisionMeeting(undefined); }}>Keep pending</Button><Button type="button" variant="outline" onClick={() => { onDecision(decisionMeeting, "pass", priorityRating); setDecisionMeeting(undefined); }}>Reject</Button></div></DialogContent></Dialog>}
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label><FieldLabel>{label}</FieldLabel>{children}</label>;
}

function PotentialMeetingEditor({ meeting, onClose, onSave, onDelete }: { meeting: PotentialMeeting; onClose: () => void; onSave: (meeting: PotentialMeeting) => void; onDelete: (meeting: PotentialMeeting) => void; }) {
  const [draft, setDraft] = useState(meeting);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = <K extends keyof PotentialMeeting>(key: K, value: PotentialMeeting[K]) => setDraft((current) => ({ ...current, [key]: value }));
  return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent className="max-w-2xl"><DialogTitle>{meeting.institutionName ? "Edit Potential Biz Meet" : "Add Potential Biz Meet"}</DialogTitle><DialogDescription>Start with the essentials. Contact details and internal notes remain visible to LVCN only.</DialogDescription><form className="mt-5 space-y-5" onSubmit={(event) => { event.preventDefault(); if (draft.institutionName.trim() && draft.organisationId) onSave({ ...draft, institutionName: draft.institutionName.trim() }); }}><section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"><p className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">1. Opportunity</p><div className="mt-3 grid gap-4 sm:grid-cols-2"><Field label="Startup *"><Select value={draft.organisationId} onChange={(event) => set("organisationId", event.target.value)}>{organisations.map((organisation) => <option key={organisation.id} value={organisation.id}>{organisation.name}</option>)}</Select></Field><Field label="Institution *"><Input required value={draft.institutionName} placeholder="e.g. Octopus Ventures" onChange={(event) => set("institutionName", event.target.value)} /></Field><Field label="Category"><Input value={draft.category} placeholder="Investor, university, NHS..." onChange={(event) => set("category", event.target.value)} /></Field><Field label="Outreach status"><Select value={draft.status} onChange={(event) => set("status", event.target.value as PotentialMeeting["status"])}>{["draft", "contacted", "agreed", "rejected", "paused"].map((status) => <option key={status} value={status}>{pretty(status)}</option>)}</Select></Field></div></section><section className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4"><p className="text-xs font-bold uppercase tracking-[.12em] text-indigo-700">2. What the startup sees</p><div className="mt-3 grid gap-4 sm:grid-cols-2"><Field label="Website"><Input type="url" value={draft.externalUrl ?? ""} placeholder="https://" onChange={(event) => set("externalUrl", event.target.value)} /></Field><Field label="Location"><Input value={draft.location ?? ""} placeholder="London, online, or TBC" onChange={(event) => set("location", event.target.value)} /></Field><label className="sm:col-span-2 text-sm font-semibold text-slate-700">Why this is relevant<textarea value={draft.startupVisibleNote ?? ""} onChange={(event) => set("startupVisibleNote", event.target.value)} placeholder="A short, clear explanation for the startup." className="mt-1 min-h-20 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm" /></label><label className="sm:col-span-2 text-sm font-semibold text-slate-700">Next action<textarea value={draft.nextAction ?? ""} onChange={(event) => set("nextAction", event.target.value)} placeholder="What should happen next?" className="mt-1 min-h-16 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm" /></label></div></section><details className="rounded-2xl border border-slate-200 bg-white p-4"><summary className="cursor-pointer text-sm font-semibold text-slate-700">Private LVCN coordination (optional)</summary><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Contact name"><Input value={draft.contactName ?? ""} onChange={(event) => set("contactName", event.target.value)} /></Field><Field label="Contact email"><Input type="email" value={draft.contactEmail ?? ""} onChange={(event) => set("contactEmail", event.target.value)} /></Field><label className="sm:col-span-2 text-sm font-semibold text-slate-700">Internal note<textarea value={draft.internalNote ?? ""} onChange={(event) => set("internalNote", event.target.value)} className="mt-1 min-h-20 w-full rounded-lg border border-slate-200 p-3 text-sm" /></label></div></details><div className="flex flex-wrap items-center justify-between gap-2"><div>{meeting.institutionName && <>{confirmDelete ? <div className="flex items-center gap-2"><Button type="button" variant="destructive" onClick={() => onDelete(meeting)}>Confirm delete</Button><button type="button" className="text-xs font-semibold text-slate-500 underline" onClick={() => setConfirmDelete(false)}>Keep</button></div> : <Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)}>Delete</Button>}</>}</div><div className="flex gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" variant="indigo">Save opportunity</Button></div></div></form></DialogContent></Dialog>;
}

function PotentialMeetingAllocation({ meeting, scheduleItems, availability, onClose, onSave }: { meeting: PotentialMeeting; scheduleItems: ScheduleItem[]; availability: AvailabilityBlock[]; onClose: () => void; onSave: (meeting: PotentialMeeting) => void; }) {
  const [start, setStart] = useState(meeting.proposedStartsAt ? meeting.proposedStartsAt.slice(0, 16) : "");
  const [end, setEnd] = useState(meeting.proposedEndsAt ? meeting.proposedEndsAt.slice(0, 16) : "");
  const startAt = start ? new Date(start).toISOString() : undefined;
  const endAt = end ? new Date(end).toISOString() : undefined;
  const clashes = startAt && endAt ? [
    ...scheduleItems.filter((item) => item.startsAt && item.endsAt && !isGenericBusinessMeetingSlot(item) && (item.visibilityScope === "cohort" || item.organisationIds.includes(meeting.organisationId)) && overlaps(startAt, endAt, item.startsAt, item.endsAt)).map((item) => item.title),
    ...availability.filter((block) => block.organisationId === meeting.organisationId && overlaps(startAt, endAt, block.startsAt, block.endsAt)).map((block) => block.title),
  ] : [];
  return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent><DialogTitle>Allocate a meeting time</DialogTitle><DialogDescription>Generic Business Meetings placeholders are deliberately ignored. This checks real programme events and the startup’s declared unavailable time.</DialogDescription><div className="mt-5 grid gap-3 sm:grid-cols-2"><Field label="Start"><Input type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} /></Field><Field label="End"><Input type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)} /></Field></div>{clashes.length > 0 && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800"><strong>Scheduling clash:</strong> {clashes.join(", ")}</p>}<div className="mt-5 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" variant="indigo" disabled={!startAt || !endAt || endAt <= startAt || clashes.length > 0} onClick={() => onSave({ ...meeting, proposedStartsAt: startAt, proposedEndsAt: endAt, status: "agreed" })}>Confirm allocation</Button></div></DialogContent></Dialog>;
}

// The former schedule-item page remains here only while legacy records are migrated.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LegacyBusinessMeetingsPage({
  items,
  isAdmin,
  profile,
  hiddenCategories,
  onCategoryVisibilityChange,
  hiddenColumns,
  onColumnVisibilityChange,
  onDecision,
  onAddMeeting,
  onSelect,
  onSelectNote,
  language,
}: {
  items: ScheduleItem[];
  isAdmin: boolean;
  profile: Profile;
  hiddenCategories: string[];
  onCategoryVisibilityChange: (category: string, visible: boolean) => void;
  hiddenColumns: string[];
  onColumnVisibilityChange: (columnId: string, visible: boolean) => void;
  onDecision: (item: ScheduleItem, decision: Decision) => void;
  onAddMeeting: () => void;
  onSelect: (id: string) => void;
  onSelectNote: (id: string) => void;
  language: Language;
}) {
  const copy = language === "ko" ? koreanUiText : uiText.en;
  const businessCopy =
    language === "ko"
      ? {
          breadcrumb: "일정 / 잠재 비즈니스 미팅",
          institution: "기관",
          category: "분류",
          decision: "결정",
          status: "상태",
          person: "담당자",
          time: "시간",
          note: "메모",
          pending: "검토 대기",
          confirm: "확인",
          reject: "거절",
          noMeetings: "현재 표시할 잠재 비즈니스 미팅이 없습니다.",
        }
      : {
          breadcrumb: "Schedule / Business meetings",
          institution: "Institution",
          category: "Category",
          decision: "Decision",
          status: "Status",
          person: "Person",
          time: "Time",
          note: "Note",
          pending: "Pending",
          confirm: "Confirm",
          reject: "Reject",
          noMeetings: "No business meetings are currently visible.",
        };
  const [adminSearch, setAdminSearch] = useState("");
  const [categoryVisibilityQuery, setCategoryVisibilityQuery] = useState("");
  const [activeColumnFilter, setActiveColumnFilter] = useState<string>();
  const [columnFilterValue, setColumnFilterValue] = useState("");
  const [pendingDecision, setPendingDecision] = useState<{
    item: ScheduleItem;
    decision: Decision;
  }>();
  useEffect(() => {
    if (!pendingDecision) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPendingDecision(undefined);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [pendingDecision]);
  const categoryFor = meetingCategoryFor;
  const noteFor = (item: ScheduleItem) =>
    item.meetingNote ?? item.description?.match(/\nNote:\s*(.*)$/)?.[1] ?? "";
  const statusFor = (item: ScheduleItem) => {
    const status = item.meetingStatus ??
    (item.status === "confirmed"
      ? "Agreed"
      : item.bookingStatus === "details_to_verify"
        ? "Contacted"
        : "Contacted");
    return status.trim().toLowerCase() === "open" ? "Contacted" : status;
  };
  const decisionFor = (item: ScheduleItem) =>
    item.responses.find(
      (entry) => entry.organisationId === profile.organisationId,
    )?.decision;
  const commitDecision = (decision: Decision) => {
    if (!pendingDecision) return;
    onDecision(pendingDecision.item, decision);
    setPendingDecision(undefined);
  };
  const categoryStyleFor = (category: string) => {
    const value = category.toLowerCase();
    if (value.includes("vc") || value.includes("invest"))
      return "text-sky-700";
    if (value.includes("defence") || value.includes("security"))
      return "text-orange-700";
    if (value.includes("health") || value.includes("medical"))
      return "text-fuchsia-700";
    if (value.includes("academic") || value.includes("research"))
      return "text-violet-700";
    if (value.includes("corporate") || value.includes("cvc"))
      return "text-cyan-700";
    return "text-emerald-700";
  };
  const query = adminSearch.trim().toLowerCase();
  const matchesAdminSearch = (item: ScheduleItem) => {
    if (!query) return false;
    return [
      item.title,
      item.contactName,
      item.meetingCategory,
      item.meetingStatus,
      item.meetingNote,
      item.description,
      item.nextAction,
      item.sourceNote,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query);
  };
  const filterValueFor = (item: ScheduleItem, columnId: string) => {
    if (columnId === "institution") return item.title;
    if (columnId === "startup") return startupsFor(item);
    if (columnId === "category") return categoryFor(item);
    if (columnId === "decision") {
      if (!isAdmin) return pretty(decisionFor(item) ?? "undecided");
      if (!item.responses.length || item.responses.some((response) => !["going", "acknowledged", "pass"].includes(response.decision))) return "Pending";
      return item.responses.some((response) => ["going", "acknowledged"].includes(response.decision)) ? "Accepted" : "Rejected";
    }
    if (columnId === "status") return statusFor(item);
    if (columnId === "time") return item.startsAt ? dateLabel(item) : "Time to confirm";
    return "";
  };
  const displayedItems = items.filter(
    (item) =>
      (!query || matchesAdminSearch(item)) &&
      (!activeColumnFilter || !columnFilterValue || filterValueFor(item, activeColumnFilter) === columnFilterValue),
  );
  const matchedCount = displayedItems.length;
  const columnVisible = (columnId: string) =>
    isAdmin || !hiddenColumns.includes(columnId);
  function startupsFor(item: ScheduleItem) {
    const names = item.organisationIds
      .map((organisationId) =>
        organisations.find((organisation) => organisation.id === organisationId)
          ?.name,
      )
      .filter(Boolean);
    return names.length ? names.join(", ") : "Cohort-wide";
  }
  const activeFilterValues = activeColumnFilter
    ? [...new Set(items.map((item) => filterValueFor(item, activeColumnFilter)).filter(Boolean))].sort()
    : [];
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[.15em] text-indigo-600">
        {language === "ko"
          ? "일정 / 비즈니스 미팅"
          : businessCopy.breadcrumb}
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">
        {copy.businessMeetings}
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
        {copy.businessIntro}
      </p>
      {!isAdmin &&
        profile.organisationId &&
        !hiddenColumns.includes("decision") && (
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-amber-900">
            {language === "ko"
              ? "결정을 기록하려면 미팅의 결정 칸을 클릭하고 수락, 보류 또는 거절을 선택하세요."
              : "To record your decision, click the Decision cell for a meeting and choose Accept, Pending or Reject."}
          </p>
        )}
      {isAdmin && (
        <>
        <details open className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4">
          <summary className="cursor-pointer font-semibold text-indigo-950">Admin workflow — adding and coordinating a meeting</summary>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-xs leading-5 text-indigo-900">
            <li>Add a named institution or person with <strong>Add Potential Biz Meet</strong>.</li>
            <li>Create a separate row for each startup when the same institution has a different introduction, status or timing. Select that startup as the audience for the row.</li>
            <li>Click a row to see the full profile, contact name, email, link and meeting notes; these details are intentionally kept out of the main table.</li>
            <li>Use the admin-only <strong>Startup</strong> table column to see the assigned company immediately.</li>
            <li>Save after checking the audience and timing.</li>
          </ol>
        </details>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,.03)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400" />
              <Input
                value={adminSearch}
                onChange={(event) => setAdminSearch(event.target.value)}
                placeholder="Find an institution, contact, email, phone or note across meetings"
                className="pl-9"
                aria-label="Search all business meeting records"
              />
            </div>
            <Button type="button" variant="indigo" onClick={onAddMeeting} className="shrink-0">
              Add Potential Biz Meet
            </Button>
            {query && (
              <p className="px-1 text-xs font-semibold text-slate-500">
                {matchedCount} matching{" "}
                {matchedCount === 1 ? "record" : "records"} shown
              </p>
            )}
          </div>
          <p className="mt-2 px-1 text-[11px] text-slate-400">
            Search filters the table to matching institutions, people, categories and notes.
          </p>
          {activeColumnFilter && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs">
              <span className="font-bold text-slate-700">Filter {activeColumnFilter}</span>
              <select
                value={columnFilterValue}
                onChange={(event) => setColumnFilterValue(event.target.value)}
                className="min-w-48 rounded-md border border-slate-200 bg-white px-2 py-1.5"
              >
                <option value="">All values</option>
                {activeFilterValues.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
              <button type="button" onClick={() => { setActiveColumnFilter(undefined); setColumnFilterValue(""); }} className="font-semibold text-indigo-700 hover:underline">Clear</button>
            </div>
          )}
          <details className="mt-3 border-t border-slate-100 pt-3">
            <summary className="cursor-pointer px-1 text-xs font-bold text-slate-700">
              Startup visibility by category
            </summary>
            <div className="mt-2 max-w-xl rounded-lg border border-slate-200 bg-slate-50 p-2">
              <Input
                value={categoryVisibilityQuery}
                onChange={(event) => setCategoryVisibilityQuery(event.target.value)}
                placeholder="Search categories"
                className="h-8 bg-white text-xs"
              />
              <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
              {[...new Set(items.map(categoryFor))]
                .sort()
                .filter((category) => category.toLowerCase().includes(categoryVisibilityQuery.trim().toLowerCase()))
                .map((category) => {
                  const visible = !hiddenCategories.includes(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => onCategoryVisibilityChange(category, !visible)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-white"
                      aria-pressed={visible}
                    >
                      <span className={cn("flex size-4 items-center justify-center rounded border", visible ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white")}>
                        {visible && <Check className="size-3" />}
                      </span>
                      {category}
                      <span className="ml-auto text-[10px] text-slate-400">{visible ? "shown" : "hidden"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </details>
        </div>
        </>
      )}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.03)]">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#286c58] text-[11px] font-bold text-white">
              <tr>
                {columnVisible("institution") && <BusinessMeetingColumnHeader columnId="institution" label={businessCopy.institution} className="w-56" isAdmin={isAdmin} visible={!hiddenColumns.includes("institution")} onVisibilityChange={onColumnVisibilityChange} onFilterClick={(id) => { setActiveColumnFilter(id); setColumnFilterValue(""); }} filterActive={activeColumnFilter === "institution"} />}
                {columnVisible("startup") && <BusinessMeetingColumnHeader columnId="startup" label="Startup" className="w-44" isAdmin={isAdmin} visible={!hiddenColumns.includes("startup")} onVisibilityChange={onColumnVisibilityChange} onFilterClick={(id) => { setActiveColumnFilter(id); setColumnFilterValue(""); }} filterActive={activeColumnFilter === "startup"} />}
                {columnVisible("category") && <BusinessMeetingColumnHeader columnId="category" label={businessCopy.category} isAdmin={isAdmin} visible={!hiddenColumns.includes("category")} onVisibilityChange={onColumnVisibilityChange} onFilterClick={(id) => { setActiveColumnFilter(id); setColumnFilterValue(""); }} filterActive={activeColumnFilter === "category"} />}
                {columnVisible("decision") && <BusinessMeetingColumnHeader columnId="decision" label={businessCopy.decision} isAdmin={isAdmin} visible={!hiddenColumns.includes("decision")} onVisibilityChange={onColumnVisibilityChange} onFilterClick={(id) => { setActiveColumnFilter(id); setColumnFilterValue(""); }} filterActive={activeColumnFilter === "decision"} />}
                {columnVisible("status") && <BusinessMeetingColumnHeader columnId="status" label={businessCopy.status} isAdmin={isAdmin} visible={!hiddenColumns.includes("status")} onVisibilityChange={onColumnVisibilityChange} onFilterClick={(id) => { setActiveColumnFilter(id); setColumnFilterValue(""); }} filterActive={activeColumnFilter === "status"} />}
                {columnVisible("time") && <BusinessMeetingColumnHeader columnId="time" label={businessCopy.time} isAdmin={isAdmin} visible={!hiddenColumns.includes("time")} onVisibilityChange={onColumnVisibilityChange} onFilterClick={(id) => { setActiveColumnFilter(id); setColumnFilterValue(""); }} filterActive={activeColumnFilter === "time"} />}
                {columnVisible("note") && <BusinessMeetingColumnHeader columnId="note" label={businessCopy.note} className="w-20 text-center" isAdmin={isAdmin} visible={!hiddenColumns.includes("note")} onVisibilityChange={onColumnVisibilityChange} />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedItems.map((item) => {
                const category = categoryFor(item);
                const note = noteFor(item);
                const searchMatch = isAdmin && matchesAdminSearch(item);
                const decision = decisionFor(item);
                const isPendingDecision =
                  !decision ||
                  ["undecided", "interested", "acknowledged"].includes(
                    decision,
                  );
              const adminDecisionSummary = item.responses.reduce(
                  (summary, response) => {
                    if (["going", "acknowledged"].includes(response.decision)) summary.accepted += 1;
                    else if (response.decision === "pass") summary.rejected += 1;
                    else summary.pending += 1;
                    return summary;
                  },
                  { pending: 0, accepted: 0, rejected: 0 },
                );
                const adminDecision =
                  adminDecisionSummary.pending > 0 || item.responses.length === 0
                    ? "pending"
                    : adminDecisionSummary.accepted > 0
                      ? "accepted"
                      : "rejected";
              return (
                  <tr
                    key={item.id}
                    tabIndex={0}
                    onClick={() => onSelect(item.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ")
                        onSelect(item.id);
                    }}
                    className={cn(
                      "cursor-pointer odd:bg-white even:bg-slate-50/70 hover:bg-indigo-50/50 focus:bg-indigo-50/60 focus:outline-none",
                      searchMatch &&
                        "bg-yellow-50 outline outline-2 outline-amber-300",
                    )}
                  >
                    {columnVisible("institution") && <td className="px-4 py-3 font-semibold text-slate-900">
                      {item.title}
                    </td>}
                    {columnVisible("startup") && <td className="w-44 px-4 py-3 text-slate-600">
                      <span className="block max-w-44 truncate" title={startupsFor(item)}>
                        {startupsFor(item)}
                      </span>
                    </td>}
                    {columnVisible("category") && <td className="px-4 py-3 text-slate-600">
                      <span
                        className={cn(
                          "text-xs font-bold",
                          categoryStyleFor(category),
                        )}
                      >
                        {category}
                      </span>
                    </td>}
                    {columnVisible("decision") && <td className="px-4 py-3">
                      {isAdmin ? (
                        <span
                          className={cn(
                            "inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold",
                            adminDecision === "accepted"
                              ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300"
                              : adminDecision === "rejected"
                                ? "bg-rose-100 text-rose-800 ring-1 ring-rose-300"
                                : "urgent-attention ring-2 ring-amber-300 ring-offset-1",
                          )}
                        >
                          {adminDecision === "accepted"
                            ? "Accepted"
                            : adminDecision === "rejected"
                              ? "Rejected"
                              : "Pending"}
                        </span>
                      ) : profile.organisationId ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setPendingDecision({
                              item,
                              decision:
                                decision === "pass"
                                  ? "going"
                                  : (decision ?? "going"),
                            });
                          }}
                          className={cn(
                            "inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold",
                            isPendingDecision
                              ? "urgent-attention ring-2 ring-amber-300 ring-offset-1"
                              : decision === "going"
                                ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300"
                                : "bg-slate-100 text-slate-700",
                            "hover:bg-indigo-100 hover:text-indigo-800 hover:shadow-none",
                          )}
                        >
                          {isPendingDecision
                            ? businessCopy.pending
                            : decision === "going"
                              ? businessCopy.confirm
                              : businessCopy.reject}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>}
                    {columnVisible("status") && <td className="px-4 py-3">
                      <span
                        className={cn(
                          "text-xs font-bold",
                          statusFor(item) === "Agreed"
                            ? "text-emerald-700"
                            : statusFor(item) === "Contacted"
                              ? "text-amber-700"
                              : "text-slate-600",
                        )}
                      >
                        {statusFor(item)}
                      </span>
                    </td>}
                    {columnVisible("time") && <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {item.startsAt ? dateLabel(item) : "Time to confirm"}
                    </td>}
                    {columnVisible("note") && <td className="w-20 px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectNote(item.id);
                        }}
                        title={note ? "Open meeting note" : "No meeting note"}
                        aria-label={note ? `Open note for ${item.title}` : `No note for ${item.title}`}
                        className={cn(
                          "inline-flex size-6 items-center justify-center rounded border transition",
                          note
                            ? "border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                            : "border-slate-200 bg-white text-transparent hover:border-slate-300",
                        )}
                      >
                        {note && <Check className="size-4" />}
                      </button>
                    </td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!displayedItems.length && (
          <p className="p-8 text-center text-sm text-slate-500">
            {query ? "No meetings match this search." : businessCopy.noMeetings}
          </p>
        )}
      </div>
      {pendingDecision && (
        <div className="fixed left-1/2 top-24 z-[80] flex -translate-x-1/2 items-center gap-3 rounded-xl bg-slate-950 px-4 py-3 text-sm text-white shadow-2xl">
          <span>Choose a decision for “{pendingDecision.item.title}”</span>
          <button type="button" onClick={() => commitDecision("going")} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-400">Accept</button>
          <button type="button" onClick={() => commitDecision("pass")} className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-400">Reject</button>
          <button type="button" onClick={() => commitDecision("undecided")} className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-300">Pending</button>
          <button type="button" onClick={() => setPendingDecision(undefined)} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20">Cancel</button>
        </div>
      )}
    </div>
  );
}

function AdminDecisionsDashboard({
  items,
  potentialMeetings,
  engagementEvents,
  engagementIdentities,
  engagementInvites,
  organisationNames,
  onOpenSchedule,
}: {
  items: ScheduleItem[];
  potentialMeetings: PotentialMeeting[];
  engagementEvents: EngagementAccessEvent[];
  engagementIdentities: EngagementIdentity[];
  engagementInvites: EngagementInvite[];
  organisationNames: Record<string, string>;
  onOpenSchedule: () => void;
}) {
  const actionable = items.filter(
    (item) =>
      item.itemType !== "company_work" && !isGenericBusinessMeetingSlot(item),
  );
  const decisionFor = (item: ScheduleItem, organisationId: string) =>
    item.responses.find((response) => response.organisationId === organisationId)
      ?.decision ?? "undecided";
  const appliesTo = (item: ScheduleItem, organisationId: string) =>
    item.visibilityScope === "cohort" || item.organisationIds.includes(organisationId);
  const breakdown = (decisions: Decision[]) => ({
    pending: decisions.filter((decision) => ["undecided", "interested"].includes(decision)).length,
    accepted: decisions.filter((decision) => ["going", "acknowledged"].includes(decision)).length,
    rejected: decisions.filter((decision) => decision === "pass").length,
  });
  const startupRows = organisations.map((organisation) => {
    const assigned = actionable.filter((item) => appliesTo(item, organisation.id));
    const decisions = assigned.map((item) => decisionFor(item, organisation.id));
    const potential = potentialMeetings.filter((meeting) => meeting.organisationId === organisation.id);
    return {
      organisation,
      schedule: breakdown(decisions),
      potential: breakdown(potential.map((meeting) => meeting.decision)),
      pending: breakdown(decisions).pending + breakdown(potential.map((meeting) => meeting.decision)).pending,
      confirmed: breakdown(decisions).accepted + breakdown(potential.map((meeting) => meeting.decision)).accepted,
      rejected: breakdown(decisions).rejected + breakdown(potential.map((meeting) => meeting.decision)).rejected,
      total: assigned.length,
    };
  });
  const totals = startupRows.reduce(
    (current, row) => ({
      pending: current.pending + row.pending,
      confirmed: current.confirmed + row.confirmed,
      rejected: current.rejected + row.rejected,
    }),
    { pending: 0, confirmed: 0, rejected: 0 },
  );
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[.15em] text-indigo-600">LVCN control centre</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Cohort Retention</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
        Monitor startup responses alongside company and user engagement throughout the programme.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Awaiting startup decisions", value: totals.pending, tone: "border-amber-200 bg-amber-50 text-amber-900" },
          { label: "Confirmed attendance", value: totals.confirmed, tone: "border-emerald-200 bg-emerald-50 text-emerald-900" },
          { label: "Rejected / not attending", value: totals.rejected, tone: "border-slate-200 bg-slate-50 text-slate-800" },
        ].map((metric) => (
          <section key={metric.label} className={cn("rounded-2xl border p-4", metric.tone)}>
            <p className="text-3xl font-bold">{metric.value}</p>
            <p className="mt-1 text-sm font-semibold">{metric.label}</p>
          </section>
        ))}
      </div>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,.03)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">Startup response board</h2>
            <p className="mt-1 text-xs text-slate-500">Counts are split between schedule rows and dedicated Potential Biz Meet decisions.</p>
          </div>
          <Button type="button" variant="secondary" onClick={onOpenSchedule}>Open master schedule</Button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-[.1em] text-slate-500">
              <tr><th className="px-3 py-2">Startup</th><th className="px-3 py-2 text-right">Schedule rows<br /><span className="font-medium normal-case tracking-normal">pending · accepted · rejected</span></th><th className="px-3 py-2 text-right">Potential Biz Meets<br /><span className="font-medium normal-case tracking-normal">pending · accepted · rejected</span></th><th className="px-3 py-2 text-right">All pending</th><th className="px-3 py-2 text-right">All actioned</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...startupRows].sort((left, right) => right.pending - left.pending).map((row) => (
                <tr key={row.organisation.id}>
                  <td className="px-3 py-2.5 font-semibold">{row.organisation.name}</td>
                  <DecisionCell breakdown={row.schedule} />
                  <DecisionCell breakdown={row.potential} />
                  <td className="px-3 py-2.5 text-right font-bold text-amber-700">{row.pending}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-emerald-700">{row.confirmed + row.rejected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <AdminEngagementPanel events={engagementEvents} identities={engagementIdentities} invites={engagementInvites} organisationNames={organisationNames} />
    </div>
  );
}

function DecisionCell({ breakdown }: { breakdown: { pending: number; accepted: number; rejected: number } }) {
  return <td className="px-3 py-2.5 text-right"><span className="font-bold text-amber-700">{breakdown.pending}</span><span className="mx-1 text-slate-300">·</span><span className="font-semibold text-emerald-700">{breakdown.accepted}</span><span className="mx-1 text-slate-300">·</span><span className="text-slate-600">{breakdown.rejected}</span></td>;
}

function DecisionsPage({
  items,
  potentialMeetings,
  engagementEvents,
  engagementIdentities,
  engagementInvites,
  organisationNames,
  profile,
  language,
  onOpenSchedule,
  onOpenBusinessMeetings,
}: {
  items: ScheduleItem[];
  potentialMeetings: PotentialMeeting[];
  engagementEvents: EngagementAccessEvent[];
  engagementIdentities: EngagementIdentity[];
  engagementInvites: EngagementInvite[];
  organisationNames: Record<string, string>;
  profile: Profile;
  language: Language;
  onOpenSchedule: () => void;
  onOpenBusinessMeetings: () => void;
}) {
  if ((profile.role as string) === "lvnc_admin")
    return (
      <AdminDecisionsDashboard
        items={items}
        potentialMeetings={potentialMeetings}
        engagementEvents={engagementEvents}
        engagementIdentities={engagementIdentities}
        engagementInvites={engagementInvites}
        organisationNames={organisationNames}
        onOpenSchedule={onOpenSchedule}
      />
    );
  const responseFor = (item: ScheduleItem) =>
    item.responses.find(
      (response) => response.organisationId === profile.organisationId,
    )?.decision ?? "undecided";
  const actionableItems = items.filter(
    (item) =>
      item.itemType !== "company_work" && !isGenericBusinessMeetingSlot(item),
  );
  const groups = [
    { title: "Items I confirmed", items: actionableItems.filter((item) => ["going", "acknowledged"].includes(responseFor(item))) },
    { title: "Items I rejected", items: actionableItems.filter((item) => responseFor(item) === "pass") },
  ];
  const pendingCount = actionableItems.filter((item) =>
    ["undecided", "interested"].includes(responseFor(item)),
  ).length;
  const pendingItems = actionableItems.filter((item) =>
    ["undecided", "interested"].includes(responseFor(item)),
  );
  const myPotentialMeetings = potentialMeetings.filter((meeting) => meeting.organisationId === profile.organisationId);
  const pendingPotentialMeetings = myPotentialMeetings.filter((meeting) => meeting.decision === "undecided");
  const pendingBreakdown = [
    {
      title: language === "ko" ? "잠재 비즈니스 미팅" : "Potential Biz Meets",
      description: language === "ko" ? "VC, 투자자 및 국방·안보 분야의 소개 미팅을 검토하세요." : "Review named VC, investor and Defence & Security introductions.",
      items: pendingPotentialMeetings,
      action: language === "ko" ? "잠재 비즈니스 미팅 열기" : "Open Potential Biz Meets",
      onClick: onOpenBusinessMeetings,
    },
    {
      title: language === "ko" ? "컨퍼런스 및 외부 기회" : "Conferences & external opportunities",
      description: language === "ko" ? "선택 가능한 컨퍼런스, 포럼 및 외부 행사를 검토하세요." : "Review optional conferences, forums and third-party events.",
      items: pendingItems.filter(
        (item) => item.itemType === "third_party",
      ),
      action: language === "ko" ? "일정 열기" : "Open Schedule",
      onClick: onOpenSchedule,
    },
    {
      title: language === "ko" ? "프로그램 참석" : "Programme attendance",
      description: language === "ko" ? "필수 또는 권장 LVCN 프로그램 세션 참석 여부를 확인하세요." : "Confirm compulsory or recommended LVCN programme sessions.",
      items: pendingItems.filter((item) => item.itemType === "lvnc_core"),
      action: language === "ko" ? "일정 열기" : "Open Schedule",
      onClick: onOpenSchedule,
    },
  ].filter((group) => group.items.length > 0);
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[.15em] text-indigo-600">
        {language === "ko" ? "결정 센터" : "Decision centre"}
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">
        {profile.role === "lvnc_admin" ? (language === "ko" ? "코호트 결정" : "Cohort decisions") : (language === "ko" ? "내 결정" : "My decisions")}
      </h1>
      <>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {language === "ko" ? "프로그램 행사, 외부 기회 및 잠재 비즈니스 미팅 전체에 대한 읽기 전용 결정 요약입니다." : "This is your read-only decision summary across programme events, opportunities and Potential Biz Meets."}
          </p>
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div>
              <p className="text-3xl font-bold text-amber-900">{pendingCount + pendingPotentialMeetings.length}</p>
              <p className="text-sm font-semibold text-amber-900">
                {language === "ko" ? `${pendingCount + pendingPotentialMeetings.length}개 결정에 확인이 필요합니다` : pendingCount + pendingPotentialMeetings.length === 1 ? "decision needs your attention" : "decisions need your attention"}
              </p>
            </div>
            <ul className="mt-4 space-y-2 border-t border-amber-200 pt-3">
              {pendingBreakdown.map((group) => (
                <li
                  key={group.title}
                  className="flex flex-col gap-1.5 text-sm text-amber-950 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
                >
                  <p className="leading-5">
                    <span className="mr-2 text-amber-600">•</span>
                    <span className="font-bold">{group.items.length} {group.title}</span>
                    <span className="block pl-4 text-xs text-amber-800">{group.description}</span>
                  </p>
                  <button type="button" onClick={group.onClick} className="ml-4 inline-flex shrink-0 items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 hover:underline">
                    {group.action}
                    <ArrowRight className="size-4" />
                  </button>
                </li>
              ))}
              {pendingBreakdown.length === 0 && (
                <li className="text-xs text-amber-800">{language === "ko" ? "현재 검토할 결정이 없습니다." : "No decisions are currently awaiting review."}</li>
              )}
            </ul>
            <p className="mt-4 text-xs leading-5 text-amber-800">
              {language === "ko" ? "사이드바의 회사 업무 기능은 개인 시간을 차단할 때만 사용하세요. 행사 및 미팅 결정과는 별개입니다." : "Use the Company work control in the sidebar only to block personal time; it is separate from event and meeting decisions."}
            </p>
          </div>
      </>
      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        {groups.map((group) => (
          <section
            key={group.title}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">{group.title}</h2>
              <Badge>{group.items.length}</Badge>
            </div>
            <div className="space-y-2">
              {group.items.map((item) => (
                <div
                  key={item.id}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left"
                >
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      itemMeta[item.itemType].dot,
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {dateLabel(item)}
                    </p>
                  </div>
                </div>
              ))}
              {group.items.length === 0 && (
                <p className="rounded-xl bg-slate-50 px-3 py-6 text-center text-sm text-slate-400">
                  Nothing here
                </p>
              )}
            </div>
          </section>
        ))}
        {myPotentialMeetings.filter((meeting) => meeting.decision !== "undecided").length > 0 && <section className="rounded-2xl border border-slate-200 bg-white p-4"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Potential Biz Meets</h2><Badge>{myPotentialMeetings.filter((meeting) => meeting.decision !== "undecided").length}</Badge></div><div className="space-y-2">{myPotentialMeetings.filter((meeting) => meeting.decision !== "undecided").map((meeting) => <div key={meeting.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2"><span className="text-sm font-semibold text-slate-800">{meeting.institutionName}</span><span className={cn("rounded-full px-2 py-1 text-xs font-bold", meeting.decision === "going" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800")}>{meeting.decision === "going" ? "Accepted" : "Rejected"}</span></div>)}</div><button type="button" onClick={onOpenBusinessMeetings} className="mt-4 text-xs font-bold text-indigo-700 hover:underline">View all Potential Biz Meets</button></section>}
      </div>
    </div>
  );
}

function ItemDrawer({
  item,
  organisationNames,
  isAdmin,
  profile,
  availability,
  highlightMeetingNote,
  onClose,
  onDecision,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  item: ScheduleItem;
  organisationNames: Record<string, string>;
  isAdmin: boolean;
  profile: Profile;
  availability: AvailabilityBlock[];
  highlightMeetingNote: boolean;
  onClose: () => void;
  onDecision: (decision: Decision, note?: string, attendancePlan?: AttendancePlan, attendanceStartsAt?: string, attendanceEndsAt?: string) => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [note, setNote] = useState(
    item.responses.find((r) => r.organisationId === profile.organisationId)
      ?.note ?? "",
  );
  const response = item.responses.find(
    (r) => r.organisationId === profile.organisationId,
  );
  const [attendancePlan, setAttendancePlan] = useState<AttendancePlan>(response?.attendancePlan ?? "not_set");
  const [customDate, setCustomDate] = useState(item.startsAt?.slice(0, 10) ?? "");
  const [customStart, setCustomStart] = useState(response?.attendanceStartsAt ? format(new Date(response.attendanceStartsAt), "HH:mm") : "09:00");
  const [customEnd, setCustomEnd] = useState(response?.attendanceEndsAt ? format(new Date(response.attendanceEndsAt), "HH:mm") : "12:00");
  const customStartsAt = attendancePlan === "custom_time" && customDate && customStart ? new Date(`${customDate}T${customStart}`).toISOString() : undefined;
  const customEndsAt = attendancePlan === "custom_time" && customDate && customEnd ? new Date(`${customDate}T${customEnd}`).toISOString() : undefined;
  const conflicts = availability.filter((block) =>
    overlaps(block.startsAt, block.endsAt, item.startsAt, item.endsAt),
  );
  const externalLink = officialExternalLinkFor(item);
  const externalLinkLabel =
    item.itemType === "business_meeting"
      ? "Open organisation profile"
      : "Open official event page";
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0)
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, []);
  const decisions: Decision[] = ["going", "undecided", "pass"];
  return (
    <>
      <button
        className="fixed inset-0 z-40 bg-slate-950/20"
        onClick={onClose}
        aria-label="Close details"
      />
      <aside className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto border-l border-slate-200 bg-white shadow-2xl sm:w-[460px]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <span
              className={cn("size-2 rounded-full", itemMeta[item.itemType].dot)}
            />
            <span className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">
              {itemMeta[item.itemType].label}
            </span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap gap-2">
            {(isAdmin || item.itemType !== "business_meeting") && (
              <Badge
                className={
                  item.status === "confirmed"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : ""
                }
              >
                {pretty(item.status)}
              </Badge>
            )}
            <Badge>{pretty(item.attendanceRule)}</Badge>
            {item.conflictGroupId && (
              <Badge className="border-rose-200 bg-rose-50 text-rose-700">
                <AlertTriangle className="mr-1 size-3" />
                Alternative choice
              </Badge>
            )}
          </div>
          <h2 className="mt-4 text-2xl font-semibold leading-tight tracking-[-.02em]">
            {item.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {item.description}
          </p>
          {isAdmin && (item.contactName || item.contactEmail) && (
            <section className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">Admin contact details</h3>
              {item.contactName && <p className="mt-2 text-sm font-semibold text-slate-800">{item.contactName}</p>}
              {item.contactEmail && <a href={`mailto:${item.contactEmail}`} className="mt-1 block break-all text-sm font-medium text-indigo-700 hover:underline">{item.contactEmail}</a>}
            </section>
          )}
          <div className="mt-6 space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
            <p className="flex gap-3">
              <CalendarDays className="mt-0.5 size-4 shrink-0 text-slate-400" />
              <span>
                <strong className="font-semibold">{dateLabel(item)}</strong>
                {item.endsAt &&
                  item.startsAt &&
                  item.timePrecision !== "all_day" && (
                    <> – {format(new Date(item.endsAt), "HH:mm")}</>
                  )}
              </span>
            </p>
            <p className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" />
              <span>{item.location ?? "Location to confirm"}</span>
            </p>
            <p className="flex gap-3">
              <Building2 className="mt-0.5 size-4 shrink-0 text-slate-400" />
              <span>
                {item.costType === "not_applicable"
                  ? "No attendee cost"
                  : pretty(item.costType)}
                {item.costNote && ` · ${item.costNote}`}
              </span>
            </p>
            {item.registrationDeadline && (
              <p className="flex gap-3">
                <Clock3 className="mt-0.5 size-4 shrink-0 text-slate-400" />
                <span>
                  Register by{" "}
                  <strong className="font-semibold">
                    {format(
                      new Date(item.registrationDeadline),
                      "EEE d MMM, HH:mm",
                    )}
                  </strong>
                </span>
              </p>
            )}
            {externalLink && (
              <a
                href={externalLink}
                target="_blank"
                rel="noreferrer"
                className="flex gap-3 font-semibold text-indigo-700 hover:underline"
              >
                <Link2 className="mt-0.5 size-4 shrink-0" />
                {externalLinkLabel} <ExternalLink className="size-3" />
              </a>
            )}
          </div>
          {item.fit && (
            <section className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">
                Why it fits
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {item.fit}
              </p>
            </section>
          )}
          {item.nextAction && (
            <section className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">
                Next action
              </h3>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-800">
                {item.nextAction}
              </p>
            </section>
          )}
          {item.meetingNote && (
            <section
              className={cn(
                "mt-6 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 transition",
                highlightMeetingNote && "note-flash border-indigo-400 bg-indigo-100 ring-4 ring-indigo-200",
              )}
            >
              <h3 className="text-xs font-bold uppercase tracking-[.12em] text-indigo-700">
                Meeting note
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {item.meetingNote}
              </p>
            </section>
          )}
          {conflicts.length > 0 && (
            <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4">
              <div className="flex gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-700" />
                <div>
                  <p className="text-sm font-bold text-rose-900">
                    Availability conflict
                  </p>
                  <p className="mt-1 text-xs leading-5 text-rose-800">
                    {isAdmin
                      ? conflicts
                          .map(
                            (block) =>
                              organisations.find(
                                (org) => org.id === block.organisationId,
                              )?.name,
                          )
                          .join(" and ") + " have overlapping private blocks."
                      : "This overlaps with company work your organisation added."}
                  </p>
                </div>
              </div>
            </div>
          )}
          {!isAdmin && (
            <section className={cn("mt-7 border-t border-slate-100 pt-6", (!response || response.decision === "undecided") && "urgent-attention rounded-2xl border border-amber-300 bg-amber-50 p-5 ring-2 ring-amber-200") }>
              <h3 className="font-semibold">Your decision</h3>
              <p className="mt-1 text-xs text-slate-500">
                Saves immediately for{" "}
                {
                  organisationNames[profile.organisationId ?? ""] ?? organisations.find((o) => o.id === profile.organisationId)?.name ?? "your company"
                }
                .
              </p>
              {(!response || response.decision === "undecided") && <p className="mt-3 text-sm font-semibold text-amber-950">Action needed: choose the option that best reflects your plans.</p>}
              <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
                <p className="text-sm font-bold text-indigo-950">How would you attend?</p>
                <p className="mt-1 text-xs leading-5 text-indigo-800">You may express interest in several overlapping events. Tell LVCN the most useful part of each event; the programme team will coordinate rather than block your choices.</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {([['full_event', 'Full event'], ['morning', 'Morning'], ['afternoon', 'Afternoon'], ['evening', 'Evening'], ['custom_time', 'Choose times']] as const).map(([plan, label]) => <button key={plan} type="button" onClick={() => setAttendancePlan(plan)} className={cn("rounded-lg border px-3 py-2 text-xs font-bold transition", attendancePlan === plan ? "border-indigo-600 bg-indigo-600 text-white" : "border-white bg-white text-slate-700 hover:border-indigo-300")}>{label}</button>)}
                </div>
                {attendancePlan === "custom_time" && <div className="mt-3 grid gap-2 sm:grid-cols-3"><DatePickerField value={customDate} onChange={setCustomDate} ariaLabel="Attendance date" min={item.startsAt?.slice(0, 10)} /><Select value={customStart} onChange={(event) => setCustomStart(event.target.value)} aria-label="Attendance start time">{Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, "0")}:00`).map((time) => <option key={time}>{time}</option>)}</Select><Select value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} aria-label="Attendance end time">{Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, "0")}:00`).map((time) => <option key={time}>{time}</option>)}</Select></div>}
              </div>
              <div
                className={cn(
                  "mt-3 grid gap-2",
                  decisions.length === 1 ? "grid-cols-1" : "grid-cols-3",
                )}
              >
                {decisions.map((decision) => (
                  <button
                    key={decision}
                    onClick={() => onDecision(decision, undefined, attendancePlan, customStartsAt, customEndsAt)}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-sm font-bold transition",
                      response?.decision === decision
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50",
                    )}
                  >
                    {decision === "going"
                      ? "Confirm"
                      : decision === "undecided"
                        ? "Pending"
                        : "Reject"}
                  </button>
                ))}
              </div>
              <FieldLabel>
                <span className="mt-5 block">Private note to LVCN</span>
              </FieldLabel>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional context for the programme team"
                className="min-h-24 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
              <Button
                type="button"
                variant="indigo"
                className="mt-3"
                disabled={!note.trim() || note.trim() === (response?.note ?? "").trim()}
                onClick={() => onDecision(response?.decision ?? "undecided", note, attendancePlan, customStartsAt, customEndsAt)}
              >
                Send message to LVCN
              </Button>
              {response?.messages?.length ? <div className="mt-5 border-t border-indigo-100 pt-4"><p className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">Conversation with LVCN</p><div className="mt-3 space-y-2">{response.messages.map((message) => <div key={message.id} className={cn("rounded-lg p-3 text-sm leading-5", message.authorRole === "lvnc_admin" ? "bg-emerald-50 text-emerald-950" : "bg-white text-slate-700")}><p className="mb-1 text-[10px] font-bold uppercase tracking-wide opacity-60">{message.authorRole === "lvnc_admin" ? "LVCN" : "Your team"} · {format(new Date(message.createdAt), "d MMM, HH:mm")}</p>{message.body}</div>)}</div>{response.conversationStatus === "awaiting_startup" && <p className="mt-3 text-xs font-bold text-amber-800">LVCN needs more detail. Reply above to return this request to their action queue.</p>}</div> : null}
            </section>
          )}
          {!isAdmin && canManageCompanyProposal(profile, item) && (
              <CompanyItemPanel onEdit={onEdit} onDelete={onDelete} />
            )}
          {isAdmin && (
            <AdminItemPanel
              item={item}
              conflicts={conflicts}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
            />
          )}
        </div>
      </aside>
    </>
  );
}

function MeetingTargetEditor({
  organisation,
  target,
  onSave,
}: {
  organisation?: { id: string; name: string };
  target: MeetingTarget;
  onSave: (target: MeetingTarget) => void;
}) {
  const [draft, setDraft] = useState(target);
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-800">
          {organisation?.name ?? "Target startup"}
        </p>
        <Select
          value={draft.outreachStatus}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              outreachStatus: event.target.value as MeetingTarget["outreachStatus"],
            }))
          }
          className="h-8 w-28 py-1 text-xs font-bold"
          aria-label={`Outreach status for ${organisation?.name ?? "startup"}`}
        >
          <option>Contacted</option>
          <option>Agreed</option>
          <option>Rejected</option>
        </Select>
      </div>
      <textarea
        value={draft.availabilityNote ?? ""}
        onChange={(event) =>
          setDraft((current) => ({ ...current, availabilityNote: event.target.value }))
        }
        placeholder="Availability windows, e.g. Thu 22 Oct 10:00–12:00 or Fri afternoon"
        className="mt-2 min-h-16 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs outline-none focus:border-indigo-400"
      />
      <textarea
        value={draft.coordinationNote ?? ""}
        onChange={(event) =>
          setDraft((current) => ({ ...current, coordinationNote: event.target.value }))
        }
        placeholder="Internal coordination note (optional)"
        className="mt-2 min-h-14 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs outline-none focus:border-indigo-400"
      />
      <div className="mt-2 flex justify-end">
        <Button type="button" variant="secondary" className="h-8 px-3 text-xs" onClick={() => onSave(draft)}>
          Save coordination
        </Button>
      </div>
    </div>
  );
}
void MeetingTargetEditor;

function CompanyItemPanel({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <section className="mt-7 border-t border-slate-100 pt-6">
      <p className="text-xs leading-5 text-slate-500">
        You can update or remove your own proposed events and company-work
        blocks.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onEdit}>
          Edit item
        </Button>
        <Button
          variant="destructive"
          onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
        >
          {confirmDelete ? "Confirm delete" : "Delete"}
        </Button>
      </div>
      {confirmDelete && (
        <button
          type="button"
          onClick={() => setConfirmDelete(false)}
          className="mt-2 text-xs font-semibold text-slate-500 underline"
        >
          Keep this item
        </button>
      )}
    </section>
  );
}

function AdminItemPanel({
  item,
  conflicts,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  item: ScheduleItem;
  conflicts: AvailabilityBlock[];
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [confirmAction, setConfirmAction] = useState<"delete">();
  const counts = (
    ["going", "interested", "pass", "undecided", "acknowledged"] as Decision[]
  )
    .map(
      (decision) =>
        [
          decision,
          item.responses.filter((r) => r.decision === decision).length,
        ] as const,
    )
    .filter(([, count]) => count > 0);
  return (
    <section className="mt-7 border-t border-slate-100 pt-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Cohort responses</h3>
        <span className="text-xs text-slate-500">
          {item.responses.length} received
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {counts.map(([decision, count]) => (
          <Badge key={decision} className="bg-slate-50">
            <strong className="mr-1 text-slate-950">{count}</strong>
            {pretty(decision)}
          </Badge>
        ))}
      </div>
      <div className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
        {item.responses.map((response) => (
          <div
            key={response.organisationId}
            className="flex items-center justify-between px-3 py-2.5"
          >
            <span className="text-sm font-medium">
              {
                organisations.find((o) => o.id === response.organisationId)
                  ?.name
              }
            </span>
            <span className="text-xs font-bold text-slate-500">
              {pretty(response.decision)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onDuplicate}>
          Duplicate
        </Button>
        <Button variant="secondary" onClick={onEdit}>
          Edit item
        </Button>
        <Button
          variant="destructive"
          onClick={() =>
            confirmAction === "delete" ? onDelete() : setConfirmAction("delete")
          }
        >
          {confirmAction === "delete" ? "Delete permanently" : "Delete"}
        </Button>
      </div>
      {confirmAction && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
          <p className="text-xs leading-5 text-rose-900">
            This permanently removes the event and its recorded responses. Use Edit item if you only need to change its details.
          </p>
          <Button
            variant="ghost"
            className="shrink-0"
            onClick={() => setConfirmAction(undefined)}
          >
            Keep event
          </Button>
        </div>
      )}
      {conflicts.length === 0 && (
        <p className="mt-4 text-xs text-slate-400">
          No private availability conflicts detected.
        </p>
      )}
    </section>
  );
}

function CreateDialog({
  open,
  setOpen,
  item,
  isAdmin,
  profile,
  defaultItemType,
  initialStartsAt,
  initialEndsAt,
  onCreate,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  item?: ScheduleItem;
  isAdmin: boolean;
  profile: Profile;
  defaultItemType?: ItemType;
  initialStartsAt?: string;
  initialEndsAt?: string;
  onCreate: (item: ScheduleItem) => void;
}) {
  const [audienceMode, setAudienceMode] = useState<"cohort" | "selected">(
    item?.visibilityScope === "selected_organisations" ? "selected" : "cohort",
  );
  const [targetIds, setTargetIds] = useState<string[]>(
    item?.organisationIds ?? [],
  );
  const [itemType, setItemType] = useState<ItemType>(
    item?.itemType ?? defaultItemType ?? (isAdmin ? "lvnc_core" : "third_party"),
  );
  const [startValue, setStartValue] = useState(
    item?.startsAt ?? initialStartsAt ?? "",
  );
  const [endValue, setEndValue] = useState(item?.endsAt ?? initialEndsAt ?? "");
  const timeOptions = Array.from({ length: 48 }, (_, index) => `${String(Math.floor(index / 2)).padStart(2, "0")}:${index % 2 ? "30" : "00"}`);
  const datePart = (value: string) => value ? format(new Date(value), "yyyy-MM-dd") : "";
  const timePart = (value: string) => value ? format(new Date(value), "HH:mm") : "";
  const updateDateTime = (date: string, time: string) => date ? `${date}T${time || "09:00"}` : "";
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!startValue || !endValue) return;
    if (isAdmin && itemType !== "lvnc_core" && targetIds.length === 0) return;
    const data = new FormData(event.currentTarget);
    const startsAt = startValue;
    const endsAt = endValue;
    // A changed start date can leave an existing end time earlier than the
    // new start. Always submit a valid one-hour slot rather than letting the
    // database reject the entire proposal with valid_time_range.
    const startDate = startsAt ? new Date(startsAt) : undefined;
    const suppliedEndDate = endsAt ? new Date(endsAt) : undefined;
    const validStartDate = startDate && !Number.isNaN(startDate.getTime()) ? startDate : undefined;
    const validEndDate = suppliedEndDate && !Number.isNaN(suppliedEndDate.getTime()) ? suppliedEndDate : undefined;
    const endDate = validStartDate && (!validEndDate || validEndDate <= validStartDate)
      ? new Date(validStartDate.getTime() + 60 * 60 * 1000)
      : validEndDate;
    const isProgramme = itemType === "lvnc_core";
    const isThirdParty = itemType === "third_party";
    onCreate({
      id: item?.id ?? crypto.randomUUID(),
      createdBy: item?.createdBy ?? profile.id,
      createdOrganisationId:
        item?.createdOrganisationId ?? (!isAdmin ? profile.organisationId : undefined),
      title: String(data.get("title")),
      description: String(data.get("description")),
      itemType,
      visibilityScope: !isAdmin
        ? "selected_organisations"
        : isProgramme
          ? "cohort"
          : "selected_organisations",
      organisationIds: !isAdmin
        ? profile.organisationId
          ? [profile.organisationId]
          : []
        : isProgramme
          ? []
          : targetIds,
      attendanceRule: isProgramme
        ? "compulsory"
        : (String(
            data.get("attendanceRule"),
          ) as ScheduleItem["attendanceRule"]),
      startsAt: validStartDate?.toISOString(),
      endsAt: endDate?.toISOString(),
      timePrecision: startsAt
        ? item?.timePrecision === "all_day"
          ? "all_day"
          : "exact"
        : "unknown",
      location: String(data.get("location")),
      eventUrl: String(data.get("eventUrl")) || undefined,
      registrationDeadline: isThirdParty
        ? String(data.get("registrationDeadline")) || undefined
        : undefined,
      reviewBy: isThirdParty
        ? String(data.get("reviewBy")) || undefined
        : undefined,
      costType: isProgramme
        ? "not_applicable"
        : (String(data.get("costType")) as ScheduleItem["costType"]),
      costNote: isThirdParty
        ? String(data.get("costNote")) || undefined
        : undefined,
      status: item?.status ?? "proposed",
      bookingStatus: String(
        data.get("bookingStatus"),
      ) as ScheduleItem["bookingStatus"],
      priority: item?.priority ?? "not_rated",
      fit: item?.fit,
      nextAction:
        String(data.get("nextAction")) || "Review details and confirm.",
      sourceNote: item?.sourceNote,
      meetingCategory:
        itemType === "business_meeting"
          ? String(data.get("meetingCategory")) || "Business meeting"
          : undefined,
      meetingStatus:
        itemType === "business_meeting"
          ? String(data.get("meetingStatus")) || "Contacted"
          : undefined,
      contactName:
        itemType === "business_meeting"
          ? String(data.get("contactName")) || undefined
          : undefined,
      meetingNote:
        itemType === "business_meeting"
          ? String(data.get("meetingNote")) || undefined
          : undefined,
      conflictGroupId: item?.conflictGroupId,
      responses: item?.responses ?? [],
    });
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>
          {item ? "Edit programme item" : "Create programme item"}
        </DialogTitle>
        <DialogDescription>
          {item
            ? "Update scheduling, audience, and action details."
            : "Core programme items belong in the Master Template; bespoke opportunities must be targeted to one or more startups."}
        </DialogDescription>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <p className="text-xs font-bold uppercase tracking-[.12em] text-emerald-800">
              Required to create this item
            </p>
            <p className="mt-1 text-xs text-emerald-700">
              Fields marked with * must be completed. Everything else is
              optional.
            </p>
          </div>
          <div>
            <FieldLabel>Title *</FieldLabel>
            <Input
              name="title"
              required
              defaultValue={item?.title}
              placeholder="e.g. Buyer introduction"
            />
          </div>
          <div>
            <FieldLabel>Description (optional)</FieldLabel>
            <textarea
              name="description"
              defaultValue={item?.description}
              className="min-h-20 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>1. What type of item is this? *</FieldLabel>
              <Select
                name="itemType"
                value={itemType}
                onChange={(event) => {
                  const nextType = event.target.value as ItemType;
                  setItemType(nextType);
                  if (nextType !== "lvnc_core") setAudienceMode("selected");
                }}
              >
                {Object.entries(itemMeta)
                  // Startup members propose external opportunities for their own
                  // company. Programme items and business introductions remain
                  // under LVCN coordination.
                  .filter(([value]) => isAdmin || value === "third_party")
                  .map(([value, meta]) => (
                    <option key={value} value={value}>
                      {meta.label}
                    </option>
                  ))}
              </Select>
              <p className="mt-1.5 text-xs text-slate-500">
                {itemType === "lvnc_core"
                  ? "Programme items are cohort-wide, compulsory, and free."
                  : itemType === "business_meeting"
                    ? "Use this for a proposed mentor, buyer, or investor meeting."
                    : itemType === "third_party"
                      ? "A conference, networking event, or external opportunity."
                      : "A startup's protected internal-work time."}
              </p>
            </div>
            {isAdmin && itemType !== "lvnc_core" && (
              <div className="sm:col-span-2">
                <FieldLabel>Audience · bespoke event</FieldLabel>
                <p className="mb-2 text-xs leading-5 text-slate-500">Only Core programme items can be cohort-wide. This item will stay out of the Master Template.</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAudienceMode("selected")}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2 text-sm font-semibold",
                      audienceMode === "selected"
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 text-slate-600",
                    )}
                  >
                    Selected startups
                  </button>
                </div>
                {audienceMode === "selected" && (
                  <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg border border-slate-200 p-2 sm:grid-cols-3">
                    {organisations.map((org) => (
                      <label
                        key={org.id}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={targetIds.includes(org.id)}
                          onChange={(e) =>
                            setTargetIds((current) =>
                              e.target.checked
                                ? [...current, org.id]
                                : current.filter((id) => id !== org.id),
                            )
                          }
                        />
                        {org.name}
                      </label>
                    ))}
                  </div>
                )}
                {targetIds.length === 0 && (
                  <p className="mt-2 text-xs font-semibold text-rose-600">Choose at least one startup.</p>
                )}
              </div>
            )}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <FieldLabel>Starts *</FieldLabel>
              <div className="mt-1 grid grid-cols-[1fr_8rem] gap-2">
                <DatePickerField ariaLabel="Start date" value={datePart(startValue)} onChange={(date) => setStartValue(updateDateTime(date, timePart(startValue)))} />
                <Select aria-label="Start time" value={timePart(startValue)} onChange={(event) => setStartValue(updateDateTime(datePart(startValue), event.target.value))}><option value="">Time</option>{timeOptions.map((time) => <option key={time} value={time}>{time}</option>)}</Select>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Choose the date, then the start time.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <FieldLabel>Ends *</FieldLabel>
              <div className="mt-1 grid grid-cols-[1fr_8rem] gap-2">
                <DatePickerField ariaLabel="End date" value={datePart(endValue)} min={datePart(startValue)} onChange={(date) => setEndValue(updateDateTime(date, timePart(endValue)))} />
                <Select aria-label="End time" value={timePart(endValue)} onChange={(event) => setEndValue(updateDateTime(datePart(endValue), event.target.value))}><option value="">Time</option>{timeOptions.map((time) => <option key={time} value={time}>{time}</option>)}</Select>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Use the same date for a same-day event.</p>
            </div>
            <div>
              <FieldLabel>Location (optional)</FieldLabel>
              <Input
                name="location"
                defaultValue={item?.location}
                placeholder="Location or Online"
              />
            </div>
            {itemType === "lvnc_core" ? (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-800">
                Attendance: compulsory for the whole cohort
              </div>
            ) : (
              <div>
                <FieldLabel>Attendance</FieldLabel>
                <Select
                  name="attendanceRule"
                  defaultValue={item?.attendanceRule ?? "optional"}
                >
                  <option value="optional">Optional</option>
                  <option value="recommended">Recommended</option>
                  <option value="compulsory">Compulsory</option>
                </Select>
              </div>
            )}
            {itemType === "business_meeting" && (
              <div className="grid gap-4 rounded-xl border border-teal-200 bg-teal-50/50 p-4 sm:col-span-2 sm:grid-cols-2">
                <div>
                  <FieldLabel>Meeting category *</FieldLabel>
                  <Input
                    name="meetingCategory"
                    required
                    defaultValue={item?.meetingCategory ?? "Business meeting"}
                    placeholder="e.g. VCs, Defence & Security"
                  />
                </div>
                <div>
                  <FieldLabel>Meeting status</FieldLabel>
                  <Input name="meetingStatus" defaultValue={item?.meetingStatus ?? "Contacted"} />
                </div>
                <div>
                  <FieldLabel>Contact (optional)</FieldLabel>
                  <Input name="contactName" defaultValue={item?.contactName} />
                </div>
                <div>
                  <FieldLabel>Meeting note (optional)</FieldLabel>
                  <Input name="meetingNote" defaultValue={item?.meetingNote} />
                </div>
              </div>
            )}
            <div>
              <FieldLabel>Booking status *</FieldLabel>
              <Select
                name="bookingStatus"
                defaultValue={
                  item?.bookingStatus === "verified"
                    ? "verified"
                    : item?.bookingStatus === "to_arrange"
                      ? "to_arrange"
                      : "details_to_verify"
                }
              >
                <option value="verified">Confirm</option>
                <option value="details_to_verify">Pending</option>
                <option value="to_arrange">Reject</option>
              </Select>
            </div>
          </div>
          <details className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-700">
              Optional details
            </summary>
            <div className="mt-4 space-y-4">
              {itemType === "third_party" && (
                <div className="grid gap-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Cost</FieldLabel>
                    <Select
                      name="costType"
                      defaultValue={item?.costType === "paid" ? "paid" : "free"}
                    >
                      <option value="free">Free</option>
                      <option value="paid">Paid</option>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel>Price / cost note</FieldLabel>
                    <Input
                      name="costNote"
                      defaultValue={item?.costNote}
                      placeholder="e.g. £180 + VAT, or n/a"
                    />
                  </div>
                  <div>
                    <FieldLabel>Registration deadline (optional)</FieldLabel>
                    <Input
                      name="registrationDeadline"
                      type="datetime-local"
                      defaultValue={
                        item?.registrationDeadline
                          ? format(
                              new Date(item.registrationDeadline),
                              "yyyy-MM-dd'T'HH:mm",
                            )
                          : undefined
                      }
                    />
                  </div>
                  <div>
                    <FieldLabel>Review by (optional)</FieldLabel>
                    <Input
                      name="reviewBy"
                      type="date"
                      defaultValue={item?.reviewBy}
                    />
                    <p className="mt-1 text-xs text-slate-500">Prompts LVCN to re-check an external event before the programme.</p>
                  </div>
                  <div>
                    <FieldLabel>Event link (optional)</FieldLabel>
                    <Input
                      name="eventUrl"
                      type="url"
                      defaultValue={item?.eventUrl}
                      placeholder="https://"
                    />
                  </div>
                </div>
              )}
              <div>
                <FieldLabel>Next action (optional)</FieldLabel>
                <Input
                  name="nextAction"
                  defaultValue={item?.nextAction}
                  placeholder="e.g. CEO and CTO will be attending only."
                />
              </div>
            </div>
          </details>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="indigo"
              disabled={!startValue || !endValue || (isAdmin && itemType !== "lvnc_core" && targetIds.length === 0)}
            >
              {item ? "Save changes" : "Create item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BusyDialog({
  open,
  setOpen,
  organisationId,
  onCreate,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  organisationId: string;
  onCreate: (block: AvailabilityBlock) => void;
}) {
  const [allDay, setAllDay] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const timeOptions = Array.from({ length: 48 }, (_, index) => `${String(Math.floor(index / 2)).padStart(2, "0")}:${index % 2 ? "30" : "00"}`);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!startDate || !endDate) return;
    const data = new FormData(event.currentTarget);
    const startsAt = allDay
      ? `${startDate}T00:00`
      : `${startDate}T${startTime}`;
    const endsAt = allDay
      ? `${endDate}T23:59`
      : `${endDate}T${endTime}`;
    onCreate({
      id: crypto.randomUUID(),
      organisationId,
      title: String(data.get("title")),
      note: String(data.get("note")),
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
    });
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>Add company work</DialogTitle>
        <DialogDescription>
          Tell LVCN when not to schedule your company. Choose all-day for a
          trip or multi-day absence, or specific hours for a lunch, call, or
          other part-day commitment. Other startups cannot see this.
        </DialogDescription>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <FieldLabel>What is blocked?</FieldLabel>
            <Input name="title" required placeholder="e.g. Travel to the UK" />
          </div>
          <div>
            <FieldLabel>What time should LVCN keep free?</FieldLabel>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setAllDay(true)} className={cn("rounded-xl border p-3 text-left text-sm font-semibold", allDay ? "border-indigo-500 bg-indigo-50 text-indigo-900" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>All day or multiple days<span className="mt-1 block text-xs font-normal">Travel, leave, or a full-day commitment.</span></button>
              <button type="button" onClick={() => setAllDay(false)} className={cn("rounded-xl border p-3 text-left text-sm font-semibold", !allDay ? "border-indigo-500 bg-indigo-50 text-indigo-900" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>Specific hours<span className="mt-1 block text-xs font-normal">For example, 09:00–13:00 on 17 October.</span></button>
            </div>
          </div>
          {allDay ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>First unavailable date</FieldLabel>
                <DatePickerField ariaLabel="First unavailable date" value={startDate} onChange={setStartDate} />
              </div>
              <div>
                <FieldLabel>Last unavailable date</FieldLabel>
                <DatePickerField ariaLabel="Last unavailable date" value={endDate} min={startDate} onChange={setEndDate} />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Starts</FieldLabel>
                <div className="grid gap-2">
                  <DatePickerField ariaLabel="Company work start date" value={startDate} onChange={setStartDate} />
                  <Select aria-label="Company work start time" value={startTime} onChange={(event) => setStartTime(event.target.value)}>{timeOptions.map((time) => <option key={time} value={time}>{time}</option>)}</Select>
                </div>
              </div>
              <div>
                <FieldLabel>Ends</FieldLabel>
                <div className="grid gap-2">
                  <DatePickerField ariaLabel="Company work end date" value={endDate} min={startDate} onChange={setEndDate} />
                  <Select aria-label="Company work end time" value={endTime} onChange={(event) => setEndTime(event.target.value)}>{timeOptions.map((time) => <option key={time} value={time}>{time}</option>)}</Select>
                </div>
              </div>
            </div>
          )}
          <div>
            <FieldLabel>Optional note for LVCN</FieldLabel>
            <Input
              name="note"
              placeholder="e.g. Flight cancelled; available from 8 October"
            />
            <p className="mt-1 text-xs text-slate-500">If you add a note, it appears with the availability alert in the admin inbox.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="indigo" disabled={!startDate || !endDate || (!allDay && `${endDate}T${endTime}` <= `${startDate}T${startTime}`)}>
              <LockKeyhole className="size-4" />
              Block time
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Kept as a compact fallback for old saved demo sessions; the enhanced flow below is used by the app.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ImportDialog({
  open,
  setOpen,
  onImport,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  onImport: (items: ScheduleItem[]) => void;
}) {
  const sample =
    "Event,Date,Start,End,Type,Location,Booking status,Next action\nFintech networking,2026-09-25,18:00,20:00,third_party,Shoreditch,to_register,Confirm attendee";
  const [source, setSource] = useState(sample);
  const parsed = useMemo(
    () =>
      Papa.parse<Record<string, string>>(source, {
        header: true,
        skipEmptyLines: true,
      }),
    [source],
  );
  const importRows = () => {
    const rows = parsed.data.filter((row) => row.Event && row.Date);
    const created = rows.map((row) => {
      const startsAt = row.Start
        ? new Date(`${row.Date}T${row.Start}:00`)
        : undefined;
      const endsAt = row.End
        ? new Date(`${row.Date}T${row.End}:00`)
        : undefined;
      return {
        id: crypto.randomUUID(),
        title: row.Event,
        itemType: ([
          "lvnc_core",
          "third_party",
          "business_meeting",
          "company_work",
        ].includes(row.Type)
          ? row.Type
          : "third_party") as ItemType,
        visibilityScope: "cohort" as const,
        organisationIds: [],
        attendanceRule: "optional" as const,
        startsAt: startsAt?.toISOString(),
        endsAt: endsAt?.toISOString(),
        timePrecision: startsAt ? ("exact" as const) : ("unknown" as const),
        location: row.Location,
        costType: "unknown" as const,
        status: "proposed" as const,
        bookingStatus: (row["Booking status"] ||
          "details_to_verify") as ScheduleItem["bookingStatus"],
        priority: "not_rated" as const,
        nextAction: row["Next action"],
        sourceNote: "Imported from reviewed CSV",
        responses: [],
      };
    });
    onImport(created);
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl">
        <DialogTitle>Review CSV import</DialogTitle>
        <DialogDescription>
          Paste normalised rows, inspect the parse, then confirm. Nothing is
          written before confirmation.
        </DialogDescription>
        <div className="mt-5">
          <FieldLabel>Source rows</FieldLabel>
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="min-h-32 w-full rounded-xl border border-slate-200 bg-slate-950 p-3 font-mono text-xs leading-5 text-slate-100 outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div className="mt-5 overflow-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[620px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {["Event", "Date", "Start", "Type", "Location", "Status"].map(
                  (header) => (
                    <th key={header} className="px-3 py-2 font-bold">
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {parsed.data.slice(0, 6).map((row, index) => (
                <tr key={index} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-semibold">
                    {row.Event || (
                      <span className="text-rose-600">Missing</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{row.Date}</td>
                  <td className="px-3 py-2">{row.Start || "Unknown"}</td>
                  <td className="px-3 py-2">{row.Type}</td>
                  <td className="px-3 py-2">{row.Location}</td>
                  <td className="px-3 py-2">
                    <Badge
                      className={
                        row.Event && row.Date
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-rose-200 bg-rose-50 text-rose-700"
                      }
                    >
                      {row.Event && row.Date ? "Ready" : "Check row"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {parsed.data.length} row{parsed.data.length === 1 ? "" : "s"} parsed
            · imports as proposed
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="indigo"
              disabled={!parsed.data.some((row) => row.Event && row.Date)}
              onClick={importRows}
            >
              Confirm import
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ImportDialogEnhanced({
  open,
  setOpen,
  onImport,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  onImport: (items: ScheduleItem[]) => void;
}) {
  const [source, setSource] = useState(
    "Event,Date,Start,End,Type,Location,Booking status,Next action\nFintech networking,2026-09-25,18:00,20:00,third_party,Shoreditch,to_register,Confirm attendee",
  );
  const [audience, setAudience] = useState<"cohort" | "selected">("cohort");
  const [targets, setTargets] = useState<string[]>([]);
  const parsed = useMemo(
    () =>
      Papa.parse<Record<string, string>>(source, {
        header: true,
        skipEmptyLines: true,
      }),
    [source],
  );
  const timing = (row: Record<string, string>) => {
    const date = row.Date?.trim();
    const raw = row.Start?.trim().toLowerCase();
    const precision =
      raw === "all day"
        ? "all_day"
        : ["morning", "afternoon", "evening"].includes(raw)
          ? raw
          : raw
            ? "exact"
            : "unknown";
    const time =
      precision === "morning"
        ? "09:00"
        : precision === "afternoon"
          ? "13:00"
          : precision === "evening"
            ? "18:00"
            : /^\d{1,2}:\d{2}$/.test(raw)
              ? raw
              : undefined;
    const start = date && time ? new Date(`${date}T${time}:00`) : undefined;
    const end =
      date && /^\d{1,2}:\d{2}$/.test(row.End?.trim() ?? "")
        ? new Date(`${date}T${row.End.trim()}:00`)
        : undefined;
    const validDate = Boolean(date && !Number.isNaN(new Date(date).getTime()));
    return {
      start: start && !Number.isNaN(start.getTime()) ? start : undefined,
      end: end && !Number.isNaN(end.getTime()) ? end : undefined,
      precision: precision as ScheduleItem["timePrecision"],
      valid: validDate,
    };
  };
  const readyRows = parsed.data.filter(
    (row) => row.Event?.trim() && timing(row).valid,
  );
  const importRows = () => {
    onImport(
      readyRows.map((row) => {
        const t = timing(row);
        return {
          id: crypto.randomUUID(),
          title: row.Event.trim(),
          itemType: ([
            "lvnc_core",
            "third_party",
            "business_meeting",
            "company_work",
          ].includes(row.Type)
            ? row.Type
            : "third_party") as ItemType,
          visibilityScope:
            audience === "cohort"
              ? ("cohort" as const)
              : ("selected_organisations" as const),
          organisationIds: audience === "cohort" ? [] : targets,
          attendanceRule: "optional" as const,
          startsAt: t.start?.toISOString(),
          endsAt: t.end?.toISOString(),
          timePrecision: t.precision,
          location: row.Location,
          eventUrl: row.Link,
          costType: "unknown" as const,
          status: "proposed" as const,
          bookingStatus: (row["Booking status"] ||
            "details_to_verify") as ScheduleItem["bookingStatus"],
          priority: "not_rated" as const,
          nextAction: row["Next action"],
          sourceNote: "Imported from reviewed CSV",
          responses: [],
        };
      }),
    );
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl">
        <DialogTitle>Review CSV import</DialogTitle>
        <DialogDescription>
          Preview, map, target, and confirm. Nothing is written before
          confirmation.
        </DialogDescription>
        <div className="mt-5">
          <FieldLabel>Source rows</FieldLabel>
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="min-h-32 w-full rounded-xl border border-slate-200 bg-slate-950 p-3 font-mono text-xs leading-5 text-slate-100 outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs leading-5 text-indigo-900">
          <strong>Column mapping:</strong> Event → title · Date + Start/End →
          timing · Type → item type · Location → location · Booking status →
          booking status · Next action → next action · Link → event URL
        </div>
        <div className="mt-4">
          <FieldLabel>Audience for imported rows</FieldLabel>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAudience("cohort")}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-bold",
                audience === "cohort"
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-slate-200",
              )}
            >
              Whole cohort
            </button>
            <button
              type="button"
              onClick={() => setAudience("selected")}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-bold",
                audience === "selected"
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-slate-200",
              )}
            >
              Selected startups
            </button>
          </div>
          {audience === "selected" && (
            <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg border border-slate-200 p-2 sm:grid-cols-4">
              {organisations.map((org) => (
                <label
                  key={org.id}
                  className="flex items-center gap-1.5 px-1 py-1 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={targets.includes(org.id)}
                    onChange={(e) =>
                      setTargets((current) =>
                        e.target.checked
                          ? [...current, org.id]
                          : current.filter((id) => id !== org.id),
                      )
                    }
                  />
                  {org.name}
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="mt-5 overflow-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {[
                  "Event",
                  "Date",
                  "Start",
                  "End",
                  "Type",
                  "Location",
                  "Check",
                ].map((header) => (
                  <th key={header} className="px-3 py-2 font-bold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parsed.data.slice(0, 8).map((row, index) => {
                const t = timing(row);
                const valid = Boolean(row.Event?.trim() && t.valid);
                return (
                  <tr key={index} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-semibold">
                      {row.Event || (
                        <span className="text-rose-600">Missing</span>
                      )}
                    </td>
                    <td className="px-3 py-2">{row.Date || "—"}</td>
                    <td className="px-3 py-2">{row.Start || "Unknown"}</td>
                    <td className="px-3 py-2">{row.End || "—"}</td>
                    <td className="px-3 py-2">{row.Type || "third_party"}</td>
                    <td className="px-3 py-2">{row.Location || "—"}</td>
                    <td className="px-3 py-2">
                      <Badge
                        className={
                          valid
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-rose-200 bg-rose-50 text-rose-700"
                        }
                      >
                        {valid
                          ? t.precision === "unknown"
                            ? "Unknown time"
                            : "Ready"
                          : "Check row"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {readyRows.length} of {parsed.data.length} rows ready · imports as
            proposed
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="indigo"
              disabled={
                !readyRows.length ||
                (audience === "selected" && !targets.length)
              }
              onClick={importRows}
            >
              Confirm import
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
