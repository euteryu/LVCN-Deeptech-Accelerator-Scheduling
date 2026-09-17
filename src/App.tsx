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
  MoreHorizontal,
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
  AvailabilityBlock,
  Decision,
  ItemType,
  Profile,
  ScheduleItem,
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
    cohortDecisions: "Cohort decisions",
    myDecisions: "My decisions",
    venueLocation: "Venue Location",
    toiletMap: "UK Toilet Map",
    externalLinks: "External event links",
    addCompanyWork: "Add company work",
    organisers: "Organisers",
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
      "Potential meetings and introductions available during the programme. LVCN sees the full coordination view; participating companies see only the details needed to decide whether an opportunity is relevant.",
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
    organisers: "주최자",
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
  businessMeetings: "Potential Biz Meets",
  cohortDecisions: "\uCF54\uD638\uD2B8 \uACB0\uC815",
  myDecisions: "\uB098\uC758 \uACB0\uC815",
  venueLocation: "\uD589\uC0AC \uC7A5\uC18C",
  toiletMap: "\uC601\uAD6D \uD654\uC7A5\uC2E4 \uC9C0\uB3C4",
  externalLinks: "\uC678\uBD80 \uD589\uC0AC \uB9C1\uD06C",
  addCompanyWork: "\uD68C\uC0AC \uC5C5\uBB34 \uCD94\uAC00",
  organisers: "\uC8FC\uCD5C\uC790",
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
} as const;

const pretty = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const bookingLabel = (value: string) =>
  value === "not_required" ? "Free attendance" : pretty(value);
const dateLabel = (item: ScheduleItem) =>
  item.startsAt
    ? format(
        new Date(item.startsAt),
        item.timePrecision === "all_day"
          ? "EEE d MMM · All day"
          : "EEE d MMM · HH:mm",
      )
    : "Time to confirm";
const overlaps = (
  startA: string,
  endA: string,
  startB?: string,
  endB?: string,
) =>
  Boolean(
    startB &&
      endB &&
      new Date(startA) < new Date(endB) &&
      new Date(endA) > new Date(startB),
  );
const calendarState = (item: ScheduleItem, decision?: Decision) =>
  item.status === "confirmed" ||
  ["going", "acknowledged"].includes(decision ?? "")
    ? "border-emerald-300 bg-emerald-50"
    : "border-dashed border-amber-300 bg-amber-50/50";
const nextWorkingDay = (date: Date, direction: 1 | -1) => {
  let next = addDays(date, direction);
  while (next.getDay() === 0 || next.getDay() === 6)
    next = addDays(next, direction);
  return next;
};
const meetingCategoryFor = (item: ScheduleItem) =>
  item.meetingCategory ??
  item.description?.match(/^Category:\s*([^\n]+)/)?.[1] ??
  "Business meeting";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-bold uppercase tracking-[.12em] text-slate-500">
      {children}
    </label>
  );
}
function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn("relative", className)}>
      <select
        {...props}
        className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white py-0 pl-3 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />
      <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-slate-400" />
    </div>
  );
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100",
        props.className,
      )}
    />
  );
}

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
  const [hiddenMeetingCategories, setHiddenMeetingCategories] = useState<
    string[]
  >(productionMode ? [] : ["Business meeting"]);
  const [hiddenSections, setHiddenSections] = useState<string[]>(
    productionMode ? [] : ["toilets"],
  );
  const [undoStack, setUndoStack] = useState<ScheduleItem[][]>([]);
  const [redoStack, setRedoStack] = useState<ScheduleItem[][]>([]);
  const [availability, setAvailability] = useState(
    productionMode ? [] : seedAvailability,
  );
  const [selectedId, setSelectedId] = useState<string>();
  const [page, setPage] = useState<
    | "calendar"
    | "business-meetings"
    | "decisions"
    | "organisers"
    | "location"
    | "toilets"
    | "external-events"
  >("calendar");
  const [week, setWeek] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [view, setView] = useState<ViewMode>(() =>
    window.innerWidth < 768 ? "day" : "week",
  );
  const [scheduleMode, setScheduleMode] = useState<"calendar" | "spreadsheet">(
    () =>
      initialProfile?.role === "startup_member" ? "spreadsheet" : "calendar",
  );
  const [mobileMenu, setMobileMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
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
  const [language, setLanguage] = useState<Language>(() =>
    window.localStorage.getItem("lvcn-language") === "ko" ? "ko" : "en",
  );
  const isAdmin = profile.role === "lvnc_admin";
  useEffect(() => {
    window.localStorage.setItem("lvcn-language", language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const client = supabase;
    if (!productionMode || !client) return;
    const load = async () => {
      const [
        { data: scheduleRows, error: scheduleError },
        { data: availabilityRows, error: availabilityError },
        { data: categoryRows, error: categoryError },
        { data: sectionRows, error: sectionError },
      ] = await Promise.all([
        client
          .from("schedule_items")
          .select(
            "*, schedule_item_organisations(organisation_id), event_responses(organisation_id,decision,note,updated_at), schedule_item_conflict_groups(conflict_group_id)",
          )
          .order("starts_at", { ascending: true, nullsFirst: false }),
        client
          .from("availability_blocks")
          .select("id,organisation_id,title,note,starts_at,ends_at")
          .order("starts_at"),
        client
          .from("meeting_category_visibility")
          .select("category,visible_to_startups"),
        client.from("app_section_visibility").select("section_id,visible_to_startups"),
      ]);
      if (scheduleError || availabilityError || categoryError || sectionError) {
        setToast(
          scheduleError?.message ??
            availabilityError?.message ??
            categoryError?.message ??
            sectionError?.message ??
            "Could not load programme",
        );
        return;
      }
      setItems(
        (scheduleRows ?? []).map((row: any) => ({
          id: row.id,
          title: row.title,
          description: row.description ?? undefined,
          itemType: row.item_type,
          visibilityScope: row.visibility_scope,
          organisationIds: row.schedule_item_organisations.map(
            (entry: any) => entry.organisation_id,
          ),
          attendanceRule: row.attendance_rule,
          startsAt: row.starts_at ?? undefined,
          endsAt: row.ends_at ?? undefined,
          timePrecision: row.time_precision,
          location: row.location ?? undefined,
          eventUrl: row.event_url ?? row.meeting_link ?? undefined,
          registrationDeadline: row.registration_deadline ?? undefined,
          costType: row.cost_type,
          costNote: row.cost_note ?? undefined,
          status: row.status,
          bookingStatus: row.booking_status,
          priority: row.priority,
          fit: row.fit ?? undefined,
          nextAction: row.next_action ?? undefined,
          sourceNote: row.source_note ?? undefined,
          meetingCategory: row.meeting_category ?? undefined,
          meetingStatus: row.meeting_status ?? undefined,
          contactName: row.contact_name ?? undefined,
          meetingNote: row.meeting_note ?? undefined,
          conflictGroupId:
            row.schedule_item_conflict_groups[0]?.conflict_group_id,
          responses: row.event_responses.map((response: any) => ({
            organisationId: response.organisation_id,
            decision: response.decision,
            note: response.note ?? undefined,
            updatedAt: response.updated_at,
          })),
        })),
      );
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
      setAvailability(
        (availabilityRows ?? []).map((row: any) => ({
          id: row.id,
          organisationId: row.organisation_id,
          title: row.title,
          note: row.note ?? undefined,
          startsAt: row.starts_at,
          endsAt: row.ends_at,
        })),
      );
    };
    void load();
    window.addEventListener("programme-refresh", load);
    return () => window.removeEventListener("programme-refresh", load);
  }, [productionMode]);

  useEffect(() => {
    const client = supabase;
    if (!productionMode || !client) return;
    const channel = client
      .channel("programme-live-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "schedule_items" },
        () => window.dispatchEvent(new Event("programme-refresh")),
      )
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
      .subscribe();
    return () => {
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
          (isAdmin ||
            (publishable &&
              (item.visibilityScope === "cohort" ||
                item.organisationIds.includes(profile.organisationId!))));
        const orgMatch =
          organisationFilter === "all" ||
          item.visibilityScope === "cohort" ||
          item.organisationIds.includes(organisationFilter);
        return (
          allowed &&
          (isAdmin ||
            item.itemType !== "business_meeting" ||
            !hiddenMeetingCategories.includes(meetingCategoryFor(item))) &&
          orgMatch &&
          (typeFilter === "all" || item.itemType === typeFilter) &&
          (statusFilter === "all" || item.status === statusFilter) &&
          item.title.toLowerCase().includes(search.toLowerCase())
        );
      }),
    [
      items,
      isAdmin,
      profile.organisationId,
      organisationFilter,
      typeFilter,
      statusFilter,
      search,
      hiddenMeetingCategories,
    ],
  );

  const visibleAvailability = availability.filter(
    (block) => isAdmin || block.organisationId === profile.organisationId,
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
      setRedoStack((future) => [...future, current]);
      return previous;
    });
    showToast("Undid last schedule change");
  };
  const redoItems = () => {
    const next = redoStack.at(-1);
    if (!next) return;
    setRedoStack((current) => current.slice(0, -1));
    setItems((current) => {
      setUndoStack((past) => [...past, current]);
      return next;
    });
    showToast("Redid schedule change");
  };

  const saveDecision = (
    target: ScheduleItem,
    decision: Decision,
    note?: string,
  ) => {
    if (!profile.organisationId) return;
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
                    response.organisationId !== profile.organisationId,
                ),
                {
                  organisationId: profile.organisationId!,
                  decision,
                  note,
                  updatedAt: new Date().toISOString(),
                },
              ],
            },
      ),
    );
    if (productionMode && supabase)
      void supabase
        .from("event_responses")
        .upsert(
          {
            schedule_item_id: target.id,
            organisation_id: profile.organisationId,
            decision,
            note: note || null,
            updated_by: profile.id,
          },
          { onConflict: "schedule_item_id,organisation_id" },
        )
        .then(({ error }) => error && showToast(error.message));
    showToast(
      createsConflict
        ? "Saved — check the alternative-choice conflict"
        : decision === "pass"
          ? "Decision saved; LVCN has been notified"
          : "Decision saved",
    );
  };
  const updateDecision = (decision: Decision, note?: string) => {
    if (selected) saveDecision(selected, decision, note);
  };

  const persistNewItem = async (item: ScheduleItem) => {
    if (!productionMode || !supabase) return;
    const { error } = await supabase.from("schedule_items").insert({
      id: item.id,
      title: item.title,
      description: item.description || null,
      item_type: item.itemType,
      visibility_scope: item.visibilityScope,
      attendance_rule: item.attendanceRule,
      starts_at: item.startsAt || null,
      ends_at: item.endsAt || null,
      time_precision: item.timePrecision,
      location: item.location || null,
      event_url: item.eventUrl || null,
      registration_deadline: item.registrationDeadline || null,
      cost_type: item.costType,
      cost_note: item.costNote || null,
      status: item.status,
      booking_status: item.bookingStatus,
      priority: item.priority,
      fit: item.fit || null,
      next_action: item.nextAction || null,
      source_note: item.sourceNote || null,
      meeting_category: item.meetingCategory || null,
      meeting_status: item.meetingStatus || null,
      contact_name: item.contactName || null,
      meeting_note: item.meetingNote || null,
      created_by: profile.id,
    });
    if (error) {
      showToast(error.message);
      return;
    }
    if (
      item.visibilityScope === "selected_organisations" &&
      item.organisationIds.length
    )
      await supabase.from("schedule_item_organisations").insert(
        item.organisationIds.map((organisationId) => ({
          schedule_item_id: item.id,
          organisation_id: organisationId,
        })),
      );
  };
  const duplicateItem = (item: ScheduleItem) => {
    const copy = {
      ...item,
      id: crypto.randomUUID(),
      title: `${item.title} (copy)`,
      status: "draft" as const,
      responses: [],
    };
    setItemsWithHistory((current) => [...current, copy]);
    void persistNewItem(copy);
    setSelectedId(copy.id);
    showToast("Draft copy created");
  };
  const cancelItem = (item: ScheduleItem) => {
    setItemsWithHistory((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, status: "cancelled" } : entry,
      ),
    );
    if (productionMode && supabase)
      void supabase
        .from("schedule_items")
        .update({ status: "cancelled" })
        .eq("id", item.id)
        .then(({ error }) => error && showToast(error.message));
    showToast("Item cancelled");
  };
  const deleteItem = (item: ScheduleItem) => {
    setItemsWithHistory((current) =>
      current.filter((entry) => entry.id !== item.id),
    );
    if (productionMode && supabase)
      void supabase
        .from("schedule_items")
        .delete()
        .eq("id", item.id)
        .then(({ error }) => error && showToast(error.message));
    setSelectedId(undefined);
    showToast("Item deleted");
  };
  const updateItem = (item: ScheduleItem) => {
    setItemsWithHistory((current) =>
      current.map((entry) => (entry.id === item.id ? item : entry)),
    );
    if (productionMode && supabase)
      void (async () => {
        const { error } = await supabase
          .from("schedule_items")
          .update({
            title: item.title,
            description: item.description || null,
            item_type: item.itemType,
            visibility_scope: item.visibilityScope,
            attendance_rule: item.attendanceRule,
            starts_at: item.startsAt || null,
            ends_at: item.endsAt || null,
            time_precision: item.timePrecision,
            location: item.location || null,
            event_url: item.eventUrl || null,
            registration_deadline: item.registrationDeadline || null,
            cost_type: item.costType,
            cost_note: item.costNote || null,
            status: item.status,
            booking_status: item.bookingStatus,
            priority: item.priority,
            fit: item.fit || null,
            next_action: item.nextAction || null,
            source_note: item.sourceNote || null,
            meeting_category: item.meetingCategory || null,
            meeting_status: item.meetingStatus || null,
            contact_name: item.contactName || null,
            meeting_note: item.meetingNote || null,
          })
          .eq("id", item.id);
        if (error) {
          showToast(error.message);
          return;
        }
        await supabase
          .from("schedule_item_organisations")
          .delete()
          .eq("schedule_item_id", item.id);
        if (item.visibilityScope === "selected_organisations")
          await supabase.from("schedule_item_organisations").insert(
            item.organisationIds.map((organisationId) => ({
              schedule_item_id: item.id,
              organisation_id: organisationId,
            })),
          );
      })();
    showToast("Item updated");
  };
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
        mode: scheduleMode,
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
        onNavigate={setPage}
        onBusy={() => setBusyOpen(true)}
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
          canUndo={!productionMode && undoStack.length > 0}
          canRedo={!productionMode && redoStack.length > 0}
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
          ) : page === "toilets" ? (
            <ToiletMapPage />
          ) : page === "external-events" ? (
            <ExternalEventsPage />
          ) : page === "business-meetings" ? (
            <BusinessMeetingsPage
              items={visibleItems.filter(
                (item) =>
                  item.itemType === "business_meeting" &&
                  meetingCategoryFor(item) !== "Business meeting",
              )}
              isAdmin={isAdmin}
              profile={profile}
              hiddenCategories={hiddenMeetingCategories}
              onCategoryVisibilityChange={setMeetingCategoryVisible}
              onDecision={saveDecision}
              onSelect={setSelectedId}
              language={language}
            />
          ) : page === "calendar" ? (
            <>
              <CalendarHeader
                scheduleMode={scheduleMode}
                language={language}
                week={week}
                view={view}
                setView={changeCalendarView}
                isAdmin={isAdmin}
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
              {isAdmin && (
                <Filters
                  typeFilter={typeFilter}
                  setTypeFilter={setTypeFilter}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  organisationFilter={organisationFilter}
                  setOrganisationFilter={setOrganisationFilter}
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
                  onCreateAt={openCreateAt}
                />
              ) : (
                <SpreadsheetBoard
                  items={visibleItems}
                  availability={visibleAvailability}
                  isAdmin={isAdmin}
                  profile={profile}
                  anchorDate={week}
                  onSelectDay={(date) => setWeek(date)}
                  onSelect={setSelectedId}
                  onDecision={(item, decision) => saveDecision(item, decision)}
                />
              )}
            </>
          ) : (
            <DecisionsPage
              items={visibleItems}
              profile={profile}
              onOpenSchedule={() => {
                setPage("calendar");
                setScheduleMode("spreadsheet");
              }}
            />
          )}
        </main>
      </div>
      {selected && (
        <ItemDrawer
          item={selected}
          isAdmin={isAdmin}
          profile={profile}
          availability={availability}
          onClose={() => setSelectedId(undefined)}
          onDecision={updateDecision}
          onEdit={() => setEditOpen(true)}
          onDuplicate={() => duplicateItem(selected)}
          onCancel={() => cancelItem(selected)}
          onDelete={() => deleteItem(selected)}
        />
      )}
      <CreateDialog
        open={createOpen}
        setOpen={setCreateOpen}
        isAdmin={isAdmin}
        profile={profile}
        initialStartsAt={createRange.startsAt}
        initialEndsAt={createRange.endsAt}
        onCreate={(item) => {
          setItemsWithHistory((current) => [...current, item]);
          void persistNewItem(item);
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
        onCreate={(block) => {
          setAvailability((current) => [...current, block]);
          if (productionMode && supabase)
            void supabase
              .from("availability_blocks")
              .insert({
                id: block.id,
                organisation_id: block.organisationId,
                title: block.title,
                note: block.note || null,
                starts_at: block.startsAt,
                ends_at: block.endsAt,
                created_by: profile.id,
              })
              .then(({ error }) => error && showToast(error.message));
          showToast("Company work added; LVCN can see the block");
        }}
      />
      <ImportDialogEnhanced
        open={importOpen}
        setOpen={setImportOpen}
        onImport={(newItems) => {
          setItemsWithHistory((current) => [...current, ...newItems]);
          newItems.forEach((item) => void persistNewItem(item));
          showToast(`${newItems.length} items imported`);
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
      | "decisions"
      | "organisers"
      | "location"
      | "toilets"
      | "external-events",
  ) => void;
  onBusy: () => void;
  hiddenSections: string[];
  onSectionVisibilityChange: (sectionId: string, visible: boolean) => void;
}) {
  const copy = language === "ko" ? koreanUiText : uiText.en;
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const nav = [
    { id: "calendar", label: copy.schedule, icon: CalendarDays },
    { id: "business-meetings", label: copy.businessMeetings, icon: Building2 },
    {
      id: "decisions",
      label:
        profile.role === "lvnc_admin" ? copy.cohortDecisions : copy.myDecisions,
      icon: LayoutList,
    },
    { id: "location", label: copy.venueLocation, icon: MapPin },
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
          "fixed inset-y-0 left-0 z-50 flex w-[232px] flex-col border-r border-slate-200 bg-[#fbfbf9] px-4 py-5 transition-[width,padding,transform] duration-200 lg:translate-x-0",
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
              const visibleToStartups = !hiddenSections.includes(id);
              return (
              <div key={id} className="group flex items-center gap-1">
                <button
              onClick={() => {
                onNavigate(
                  id as
                    | "calendar"
                    | "business-meetings"
                    | "decisions"
                    | "organisers"
                    | "location"
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
            </button>
            {profile.role === "lvnc_admin" && !collapsed && (
              <button
                type="button"
                onClick={() => onSectionVisibilityChange(id, !visibleToStartups)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                title={visibleToStartups ? "Hide from startups" : "Show to startups"}
                aria-label={`${visibleToStartups ? "Hide" : "Show"} ${label} for startups`}
              >
                {visibleToStartups ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </button>
            )}
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
        <a
          href="https://luma.com/koreavc"
          target="_blank"
          rel="noreferrer"
          title={collapsed ? copy.investorShowcase : undefined}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100",
            collapsed && "lg:justify-center lg:px-2",
          )}
        >
          <ExternalLink className="size-[18px] shrink-0" />
          <span className={cn(collapsed && "lg:hidden")}>
            {copy.investorShowcase}
          </span>
        </a>
        <button
          type="button"
          onClick={() => setTutorialOpen(true)}
          title={collapsed ? "Tutorial" : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950",
            collapsed && "lg:justify-center lg:px-2",
          )}
        >
          <CircleHelp className="size-[18px] shrink-0" />
          <span className={cn(collapsed && "lg:hidden")}>Tutorial</span>
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
        <TutorialDialog open={tutorialOpen} setOpen={setTutorialOpen} />
      </aside>
    </Fragment>
  );
}

function TutorialDialog({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl">
        <DialogTitle>How to use the programme board</DialogTitle>
        <DialogDescription>
          Five quick ways to interact with the app.
        </DialogDescription>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <figure key={step} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <img
                src={`/tutorial/df${step}.png`}
                alt={`Tutorial step ${step}`}
                loading="lazy"
                className="w-full bg-white"
              />
              <figcaption className="px-3 py-2 text-xs font-semibold text-slate-600">
                Tutorial {step} of 5
              </figcaption>
            </figure>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OrganisersPage() {
  const links = [
    [
      "KISED",
      "https://www.kised.or.kr/_eng/",
      "Korea Institute of Startup & Entrepreneurship Development. Supports startup growth, entrepreneurship, commercialisation and global expansion.",
    ],
    [
      "PEN Ventures",
      "https://pen.ventures/",
      "Connects partners and supports innovative ideas as they launch and grow.",
    ],
    [
      "LVCN",
      "https://www.lvcn.co.uk/",
      "London Venture Capital Network connects founders, investors and the wider innovation ecosystem.",
    ],
  ];
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[.15em] text-indigo-600">
        Useful links
      </p>
      <h1 className="mt-1 text-3xl font-semibold">Organisers</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {links.map(([name, url, description]) => (
          <a
            key={name}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-indigo-300 hover:bg-indigo-50"
          >
            <p className="font-semibold">
              {name}
              <ExternalLink className="ml-2 inline size-4" />
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {description}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}

function LocationPage() {
  const [copied, setCopied] = useState(false);
  const address = "77 Fulham Palace Road, The Foundry, London W6 8AF";
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[.15em] text-indigo-600">
        Venue location
      </p>
      <h1 className="mt-1 text-3xl font-semibold">Hammersmith The Foundry</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
        Our programme base offers premium offices and coworking space close to
        Charing Cross Hospital and Hammersmith Town Hall, with Kings Mall and
        the Lyric Hammersmith nearby. It is a practical, collaborative base for
        the London programme.
      </p>
      <button
        onClick={() => {
          void navigator.clipboard.writeText(address);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        }}
        className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-4 text-left font-semibold text-indigo-900"
      >
        {address}
        <span className="mt-1 block text-xs font-medium text-indigo-600">
          {copied ? "Copied" : "Click to copy address"}
        </span>
      </button>
      <a
        href="https://www.spacesworks.com/en/gb/4699"
        target="_blank"
        rel="noreferrer"
        className="ml-3 inline-flex rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800 hover:bg-teal-100"
      >
        Venue details <ExternalLink className="ml-2 size-4" />
      </a>
      <iframe
        title="Hammersmith The Foundry map"
        className="mt-6 h-[420px] w-full rounded-2xl border"
        src="https://www.google.com/maps?q=77%20Fulham%20Palace%20Road%20London%20W6%208AF&output=embed"
      />
    </div>
  );
}

function ToiletMapPage() {
  const links = [
    [
      "The Great British Public Toilet Map",
      "https://www.toiletmap.org.uk/",
      "Nationwide public and community toilet finder.",
    ],
    [
      "Spend a Penny",
      "https://www.spendapenny.uk/",
      "Nearby toilets with opening and accessibility information.",
    ],
    [
      "Where To Wee",
      "https://wheretowee.uk/free-public-toilets",
      "Free public conveniences and accessible facilities.",
    ],
  ];
  const cardStyles = [
    "border-teal-200 bg-teal-50 text-teal-900 hover:bg-teal-100",
    "border-indigo-200 bg-indigo-50 text-indigo-900 hover:bg-indigo-100",
    "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100",
  ];
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[.15em] text-indigo-600">
        Useful on the move
      </p>
      <h1 className="mt-1 text-3xl font-semibold">UK Toilet Map</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
        Find nearby public, community, and accessible toilets while travelling
        between programme events.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {links.map(([name, url, description], index) => (
          <a
            key={name}
            href={url}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "rounded-2xl border p-5 transition",
              cardStyles[index],
            )}
          >
            <p className="font-semibold">
              {name}
              <ExternalLink className="ml-2 inline size-4" />
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {description}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}

function ExternalEventsPage() {
  const links = [
    ["Luma", "https://lu.ma/", "Founder, technology, and community events."],
    [
      "Partiful",
      "https://partiful.com/",
      "Community and social event discovery.",
    ],
    [
      "Meetup",
      "https://www.meetup.com/",
      "Local groups, founder meetups, and workshops.",
    ],
    [
      "CodeNode",
      "https://www.codenode.com/",
      "London technology-community events and workspace.",
    ],
    [
      "Entrepreneurs Collective",
      "https://www.entrepreneurscollective.biz/calendar/",
      "Founder, investor, and pitch events.",
    ],
    [
      "Eventbrite",
      "https://www.eventbrite.co.uk/",
      "Broad event and ticket listings.",
    ],
    [
      "Tech.eu",
      "https://tech.eu/events/",
      "European technology ecosystem events.",
    ],
  ];
  const cardStyles = [
    "border-indigo-200 bg-indigo-50 text-indigo-900 hover:bg-indigo-100",
    "border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100",
    "border-teal-200 bg-teal-50 text-teal-900 hover:bg-teal-100",
    "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100",
  ];
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[.15em] text-indigo-600">
        Discovery resources
      </p>
      <h1 className="mt-1 text-3xl font-semibold">External event links</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
        Useful sources for finding opportunities to review before adding them to
        the programme schedule.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {links.map(([name, url, description], index) => (
          <a
            key={name}
            href={url}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "rounded-2xl border p-5 transition",
              cardStyles[index % cardStyles.length],
            )}
          >
            <p className="font-semibold">
              {name}
              <ExternalLink className="ml-2 inline size-4" />
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {description}
            </p>
          </a>
        ))}
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
            <Pulse items={items} availability={availability} />
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
  availability,
}: {
  items: ScheduleItem[];
  availability: AvailabilityBlock[];
}) {
  const metrics = [
    [
      "Confirmed programme",
      items.filter(
        (i) => i.itemType === "lvnc_core" && i.status === "confirmed",
      ).length,
      "text-indigo-700",
    ],
    [
      "Booking or verification",
      items.filter((i) =>
        [
          "to_register",
          "details_to_verify",
          "approval_required",
          "to_arrange",
        ].includes(i.bookingStatus),
      ).length,
      "text-amber-700",
    ],
    [
      "Unresolved decisions",
      items.reduce(
        (sum, i) =>
          sum + i.responses.filter((r) => r.decision === "undecided").length,
        0,
      ),
      "text-slate-900",
    ],
    [
      "Conflict groups",
      new Set(
        items.filter((i) => i.conflictGroupId).map((i) => i.conflictGroupId),
      ).size,
      "text-rose-700",
    ],
    [
      "Availability conflicts",
      items.filter((item) =>
        availability.some((block) =>
          overlaps(block.startsAt, block.endsAt, item.startsAt, item.endsAt),
        ),
      ).length,
      "text-rose-700",
    ],
  ];
  return (
    <section className="flex min-w-0 items-center gap-4 xl:gap-6">
      {metrics.map(([label, value, color]) => (
        <div className="flex min-w-0 items-center gap-1.5" key={String(label)}>
          <span className={cn("text-sm font-bold leading-none", color)}>
            {value}
          </span>
          <span className="truncate text-[10px] font-medium text-slate-500">
            {label}
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
        <Button variant="indigo" onClick={onCreate}>
          <Plus className="size-4" />
          {isAdmin ? copy.createItem : copy.proposeEvent}
        </Button>
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
            <div className="absolute right-0 top-11 z-20 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
              <button
                onClick={() => {
                  setExportOpen(false);
                  onExport("excel");
                }}
                className="flex w-full gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
              >
                <FileDown className="size-4" />
                {language === "ko" ? "Excel 파일" : "Excel workbook"}
              </button>
              <button
                onClick={() => {
                  setExportOpen(false);
                  onExport("pdf");
                }}
                className="flex w-full gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
              >
                <Printer className="size-4" />
                {language === "ko" ? "인쇄용 PDF" : "Print-ready PDF"}
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <CalendarKey typeFilter={typeFilter} setTypeFilter={setTypeFilter} />
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
}: {
  typeFilter: string;
  setTypeFilter: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 text-[10px] font-semibold text-slate-500">
      <span className="font-bold uppercase tracking-[.12em] text-slate-400">
        Key
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2 rounded-sm border border-emerald-300 bg-emerald-50" />
        Confirmed
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2 rounded-sm border border-dashed border-amber-400 bg-amber-50" />
        Decision pending
      </span>
      {Object.entries(itemMeta).map(([type, meta]) => (
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
        <option value="all">MASTER TEMPLATE</option>
        {organisations.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </Select>
      <span className="px-2 text-[10px] font-medium text-slate-500">
        MASTER TEMPLATE edits update the shared plan; each company still decides
        whether to attend optional items.
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
      <Select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="w-full sm:min-w-36 sm:flex-1"
      >
        <option value="all">All statuses</option>
        {["draft", "proposed", "confirmed", "cancelled"].map((value) => (
          <option key={value} value={value}>
            {pretty(value)}
          </option>
        ))}
      </Select>
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
              const meta = itemMeta[item.itemType];
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
  profile,
  anchorDate,
  onSelectDay,
  onSelect,
  onDecision,
}: {
  items: ScheduleItem[];
  availability: AvailabilityBlock[];
  isAdmin: boolean;
  profile: Profile;
  anchorDate: Date;
  onSelectDay: (date: Date) => void;
  onSelect: (id: string) => void;
  onDecision: (item: ScheduleItem, decision: Decision) => void;
}) {
  const [pendingDecision, setPendingDecision] = useState<{
    item: ScheduleItem;
    decision: Decision;
  }>();
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
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.03)]">
      <div className="overflow-x-auto">
        <table className="min-w-[1160px] w-full border-collapse text-left text-sm">
          <thead className="bg-[#286c58] text-[11px] font-bold text-white">
            <tr>
              <th className="min-w-[320px] border-b border-emerald-900/30 px-4 py-2">
                Event / Meeting
              </th>
              <th className="w-20 border-b border-emerald-900/30 px-3 py-2">
                Start
              </th>
              <th className="w-20 border-b border-emerald-900/30 px-3 py-2">
                End
              </th>
              <th className="w-44 border-b border-emerald-900/30 px-3 py-2">
                Type
              </th>
              <th className="w-32 border-b border-emerald-900/30 px-3 py-2">
                Decision
              </th>
              <th className="min-w-[260px] border-b border-emerald-900/30 px-3 py-2">
                Notes (e.g. Costs; Deadlines)
              </th>
              <th className="min-w-[250px] border-b border-emerald-900/30 px-3 py-2">
                Location
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((item, index) => {
              const dateKey = item.startsAt
                ? format(new Date(item.startsAt), "yyyy-MM-dd")
                : "unknown";
              const previousItem = rows[index - 1];
              const previousItemDate = previousItem?.startsAt
                ? format(new Date(previousItem.startsAt), "yyyy-MM-dd")
                : previousItem
                  ? "unknown"
                  : "";
              const showDateBand = dateKey !== previousItemDate;
              const isAnchoredDate = item.startsAt
                ? isSameDay(new Date(item.startsAt), anchorDate)
                : false;
              const meta = itemMeta[item.itemType];
              const decision = item.responses.find(
                (response) =>
                  response.organisationId === profile.organisationId,
              )?.decision;
              const isPendingDecision =
                !decision ||
                ["undecided", "interested", "acknowledged"].includes(decision);
              const conflict = availability.some((block) =>
                overlaps(
                  block.startsAt,
                  block.endsAt,
                  item.startsAt,
                  item.endsAt,
                ),
              );
              const notes = [
                item.costNote,
                item.nextAction,
                bookingLabel(item.bookingStatus),
                conflict && "Availability conflict",
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <Fragment key={item.id}>
                  {showDateBand && (
                    <tr
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        item.startsAt && onSelectDay(new Date(item.startsAt))
                      }
                      onKeyDown={(event) => {
                        if (
                          (event.key === "Enter" || event.key === " ") &&
                          item.startsAt
                        )
                          onSelectDay(new Date(item.startsAt));
                      }}
                      className={cn(
                        "cursor-pointer bg-[#9acb82] text-[13px] font-bold text-slate-950 hover:bg-[#abd392]",
                        isAnchoredDate &&
                          "relative outline outline-2 outline-indigo-500 outline-offset-[-2px]",
                      )}
                    >
                      <td colSpan={7} className="px-3 py-1.5">
                        {item.startsAt
                          ? format(new Date(item.startsAt), "EEEE, d MMMM yyyy")
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
                    className="cursor-pointer odd:bg-white even:bg-slate-50/70 hover:bg-indigo-50/50 focus:bg-indigo-50/60 focus:outline-none"
                  >
                    <td className="hidden">
                      {item.timePrecision === "all_day" ? "●" : ""}
                    </td>
                    <td className="px-4 py-2 align-top font-semibold text-slate-900">
                      {item.title}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 align-top text-xs font-semibold text-slate-700">
                      {item.startsAt && item.timePrecision !== "all_day"
                        ? format(new Date(item.startsAt), "HH:mm")
                        : item.startsAt
                          ? "All day"
                          : "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 align-top text-xs font-semibold text-slate-700">
                      {item.endsAt && item.timePrecision !== "all_day"
                        ? format(new Date(item.endsAt), "HH:mm")
                        : "—"}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <span className="inline-flex items-center gap-2 rounded-md bg-white/80 px-2 py-1 text-xs font-semibold text-slate-700">
                        <span className={cn("size-2 rounded-full", meta.dot)} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top">
                      {profile.organisationId ? (
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
                              ? "animate-pulse bg-amber-100 text-amber-900 shadow-[0_0_0_3px_rgba(251,191,36,.28),0_0_26px_rgba(245,158,11,.7)] ring-2 ring-amber-300 ring-offset-1"
                              : decision === "going"
                                ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300"
                                : "bg-slate-100 text-slate-700",
                            "hover:bg-indigo-100 hover:text-indigo-800 hover:shadow-none",
                          )}
                        >
                          {isPendingDecision
                            ? "Pending"
                            : decision === "going"
                              ? "Confirm"
                              : "Reject"}
                        </button>
                      ) : (
                        <span
                          className={cn(
                            "inline-flex rounded-md px-2 py-1 text-[10px] font-bold",
                            decision === "going"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-700",
                          )}
                        >
                          {decision === "going"
                            ? "Confirmed"
                            : pretty(decision ?? "undecided")}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top text-xs text-slate-600">
                      {notes || "—"}
                    </td>
                    <td className="px-3 py-2 align-top text-xs text-slate-600">
                      {item.location || "London / TBC"}
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
        <div className="fixed bottom-5 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-3 rounded-xl bg-slate-950 px-4 py-3 text-sm text-white shadow-2xl">
          <span>Choose a decision for “{pendingDecision.item.title}”</span>
          <button
            type="button"
            onClick={() => commitDecision("going")}
            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-400"
          >
            Confirm
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
  onClick,
  style,
}: {
  item: ScheduleItem;
  isAdmin: boolean;
  profile: Profile;
  availability: AvailabilityBlock[];
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
  return (
    <button
      onClick={onClick}
      className={cn(
        "absolute z-20 overflow-hidden rounded-md border px-2 py-1 text-left shadow-sm transition hover:z-30 hover:shadow-md",
        calendarState(item, response?.decision),
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
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md",
        calendarState(item, response?.decision),
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
        {item.status !== "confirmed" && (
          <span className="text-[9px] font-bold text-amber-700">
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

function BusinessMeetingsPage({
  items,
  isAdmin,
  profile,
  hiddenCategories,
  onCategoryVisibilityChange,
  onDecision,
  onSelect,
  language,
}: {
  items: ScheduleItem[];
  isAdmin: boolean;
  profile: Profile;
  hiddenCategories: string[];
  onCategoryVisibilityChange: (category: string, visible: boolean) => void;
  onDecision: (item: ScheduleItem, decision: Decision) => void;
  onSelect: (id: string) => void;
  language: Language;
}) {
  const copy = language === "ko" ? koreanUiText : uiText.en;
  const [adminSearch, setAdminSearch] = useState("");
  const [pendingDecision, setPendingDecision] = useState<{
    item: ScheduleItem;
    decision: Decision;
  }>();
  const categoryFor = meetingCategoryFor;
  const noteFor = (item: ScheduleItem) =>
    item.meetingNote ?? item.description?.match(/\nNote:\s*(.*)$/)?.[1] ?? "";
  const statusFor = (item: ScheduleItem) =>
    item.meetingStatus ??
    (item.status === "confirmed"
      ? "Agreed"
      : item.bookingStatus === "details_to_verify"
        ? "Contacted"
        : "Open");
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
  const matchedCount = items.filter(matchesAdminSearch).length;
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[.15em] text-indigo-600">
        {language === "ko"
          ? "일정 / 비즈니스 미팅"
          : "Schedule / Business meetings"}
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">
        {copy.businessMeetings}
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
        {copy.businessIntro}
      </p>
      {isAdmin && (
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
            {query && (
              <p className="px-1 text-xs font-semibold text-slate-500">
                {matchedCount} matching{" "}
                {matchedCount === 1 ? "record" : "records"} highlighted
              </p>
            )}
          </div>
          <p className="mt-2 px-1 text-[11px] text-slate-400">
            Search results stay in the table so repeated institutions or
            contacts across startups remain visible together.
          </p>
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="px-1 text-xs font-bold text-slate-700">
              Startup visibility by category
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[...new Set(items.map(categoryFor))]
                .sort()
                .map((category) => {
                  const visible = !hiddenCategories.includes(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => onCategoryVisibilityChange(category, !visible)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition",
                        visible
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                          : "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200",
                      )}
                      aria-pressed={visible}
                    >
                      {visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                      {category}: {visible ? "shown" : "hidden"}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.03)]">
        <div className="overflow-x-auto">
          <table className="min-w-[1080px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#286c58] text-[11px] font-bold text-white">
              <tr>
                <th className="px-4 py-2.5">Institution</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Decision</th>
                <th className="px-4 py-2.5">Status</th>
                {isAdmin && <th className="px-4 py-2.5">Person</th>}
                <th className="px-4 py-2.5">Time</th>
                <th className="px-4 py-2.5">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                const category = categoryFor(item);
                const searchMatch = isAdmin && matchesAdminSearch(item);
                const decision = decisionFor(item);
                const isPendingDecision =
                  !decision ||
                  ["undecided", "interested", "acknowledged"].includes(
                    decision,
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
                    className={cn(
                      "cursor-pointer odd:bg-white even:bg-slate-50/70 hover:bg-indigo-50/50 focus:bg-indigo-50/60 focus:outline-none",
                      searchMatch &&
                        "bg-yellow-50 outline outline-2 outline-amber-300",
                    )}
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {item.title}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span
                        className={cn(
                          "text-xs font-bold",
                          categoryStyleFor(category),
                        )}
                      >
                        {category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {profile.organisationId ? (
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
                              ? "animate-pulse bg-amber-100 text-amber-900 shadow-[0_0_0_3px_rgba(251,191,36,.28),0_0_26px_rgba(245,158,11,.7)] ring-2 ring-amber-300 ring-offset-1"
                              : decision === "going"
                                ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300"
                                : "bg-slate-100 text-slate-700",
                            "hover:bg-indigo-100 hover:text-indigo-800 hover:shadow-none",
                          )}
                        >
                          {isPendingDecision
                            ? "Pending"
                            : decision === "going"
                              ? "Confirm"
                              : "Reject"}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
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
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-slate-500">
                        {item.contactName ?? ""}
                      </td>
                    )}
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {item.startsAt ? dateLabel(item) : "Time to confirm"}
                    </td>
                    <td className="max-w-[360px] px-4 py-3 text-slate-600">
                      {noteFor(item)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!items.length && (
          <p className="p-8 text-center text-sm text-slate-500">
            No business meetings are currently visible.
          </p>
        )}
      </div>
      {pendingDecision && (
        <div className="fixed bottom-5 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-3 rounded-xl bg-slate-950 px-4 py-3 text-sm text-white shadow-2xl">
          <span>Choose a decision for “{pendingDecision.item.title}”</span>
          <button type="button" onClick={() => commitDecision("going")} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-400">Confirm</button>
          <button type="button" onClick={() => commitDecision("pass")} className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-400">Reject</button>
          <button type="button" onClick={() => commitDecision("undecided")} className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-300">Pending</button>
          <button type="button" onClick={() => setPendingDecision(undefined)} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20">Cancel</button>
        </div>
      )}
    </div>
  );
}

function DecisionsPage({
  items,
  profile,
  onOpenSchedule,
}: {
  items: ScheduleItem[];
  profile: Profile;
  onOpenSchedule: () => void;
}) {
  const responseFor = (item: ScheduleItem) =>
    item.responses.find(
      (response) => response.organisationId === profile.organisationId,
    )?.decision ?? "undecided";
  const actionableItems = items.filter((item) => item.itemType !== "company_work");
  const groups = profile.role === "lvnc_admin"
    ? [
        { title: "Needs a cohort response", items: items.filter((item) => item.responses.some((response) => response.decision === "undecided")) },
        { title: "Booking or action required", items: items.filter((item) => item.bookingStatus !== "not_required" && item.bookingStatus !== "verified") },
      ]
    : [
        { title: "Confirmed", items: actionableItems.filter((item) => ["going", "acknowledged"].includes(responseFor(item))) },
        { title: "Rejected", items: actionableItems.filter((item) => responseFor(item) === "pass") },
      ];
  const pendingCount = actionableItems.filter((item) =>
    ["undecided", "interested"].includes(responseFor(item)),
  ).length;
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[.15em] text-indigo-600">
        Decision centre
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">
        {profile.role === "lvnc_admin" ? "Cohort decisions" : "My decisions"}
      </h1>
      {profile.role === "lvnc_admin" ? (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          A focused view of choices and follow-up, without the calendar noise.
        </p>
      ) : (
        <>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            This is your read-only decision summary across programme events,
            opportunities and Potential Biz Meets.
          </p>
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-3xl font-bold text-amber-900">{pendingCount}</p>
              <p className="text-sm font-semibold text-amber-900">
                {pendingCount === 1 ? "decision needs your attention" : "decisions need your attention"}
              </p>
              <p className="mt-1 max-w-xl text-xs leading-5 text-amber-800">
                Choose Confirm or Reject in Schedule → Spreadsheet. Use the
                Company work control in the sidebar to block personal time.
              </p>
            </div>
            <Button type="button" variant="indigo" onClick={onOpenSchedule}>
              <CalendarDays className="size-4" />
              Open schedule
            </Button>
          </div>
        </>
      )}
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
      </div>
    </div>
  );
}

function ItemDrawer({
  item,
  isAdmin,
  profile,
  availability,
  onClose,
  onDecision,
  onEdit,
  onDuplicate,
  onCancel,
  onDelete,
}: {
  item: ScheduleItem;
  isAdmin: boolean;
  profile: Profile;
  availability: AvailabilityBlock[];
  onClose: () => void;
  onDecision: (decision: Decision, note?: string) => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const [note, setNote] = useState(
    item.responses.find((r) => r.organisationId === profile.organisationId)
      ?.note ?? "",
  );
  const response = item.responses.find(
    (r) => r.organisationId === profile.organisationId,
  );
  const conflicts = availability.filter((block) =>
    overlaps(block.startsAt, block.endsAt, item.startsAt, item.endsAt),
  );
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
            {isAdmin && (
              <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <MoreHorizontal className="size-5" />
              </button>
            )}
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
            {item.eventUrl && (
              <a
                href={item.eventUrl}
                target="_blank"
                rel="noreferrer"
                className="flex gap-3 font-semibold text-indigo-700 hover:underline"
              >
                <Link2 className="mt-0.5 size-4 shrink-0" />
                Open event link <ExternalLink className="size-3" />
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
            <section className="mt-7 border-t border-slate-100 pt-6">
              <h3 className="font-semibold">Your decision</h3>
              <p className="mt-1 text-xs text-slate-500">
                Saves immediately for{" "}
                {
                  organisations.find((o) => o.id === profile.organisationId)
                    ?.name
                }
                .
              </p>
              <div
                className={cn(
                  "mt-3 grid gap-2",
                  decisions.length === 1 ? "grid-cols-1" : "grid-cols-3",
                )}
              >
                {decisions.map((decision) => (
                  <button
                    key={decision}
                    onClick={() => onDecision(decision, note)}
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
                onBlur={() => response && onDecision(response.decision, note)}
                placeholder="Optional context for the programme team"
                className="min-h-24 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </section>
          )}
          {!isAdmin &&
            profile.organisationId &&
            item.organisationIds.includes(profile.organisationId) && (
              <CompanyItemPanel onEdit={onEdit} onDelete={onDelete} />
            )}
          {isAdmin && (
            <AdminItemPanel
              item={item}
              conflicts={conflicts}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onCancel={onCancel}
              onDelete={onDelete}
            />
          )}
        </div>
      </aside>
    </>
  );
}

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
  onCancel,
  onDelete,
}: {
  item: ScheduleItem;
  conflicts: AvailabilityBlock[];
  onEdit: () => void;
  onDuplicate: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const [confirmAction, setConfirmAction] = useState<"cancel" | "delete">();
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
          variant={confirmAction === "cancel" ? "destructive" : "secondary"}
          onClick={() =>
            confirmAction === "cancel" ? onCancel() : setConfirmAction("cancel")
          }
        >
          {confirmAction === "cancel" ? "Confirm cancellation" : "Cancel event"}
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
            {confirmAction === "delete"
              ? "This permanently removes the event and its recorded responses."
              : "This removes the event from every calendar. You can still find it by changing its status in the database."}
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
  initialStartsAt,
  initialEndsAt,
  onCreate,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  item?: ScheduleItem;
  isAdmin: boolean;
  profile: Profile;
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
    item?.itemType ?? (isAdmin ? "lvnc_core" : "third_party"),
  );
  const [startValue, setStartValue] = useState(
    item?.startsAt ?? initialStartsAt ?? "",
  );
  const [endValue, setEndValue] = useState(item?.endsAt ?? initialEndsAt ?? "");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const startsAt = startValue;
    const endsAt = endValue;
    const isProgramme = itemType === "lvnc_core";
    const isThirdParty = itemType === "third_party";
    onCreate({
      id: item?.id ?? crypto.randomUUID(),
      title: String(data.get("title")),
      description: String(data.get("description")),
      itemType,
      visibilityScope: !isAdmin
        ? "selected_organisations"
        : isProgramme || audienceMode === "cohort"
          ? "cohort"
          : "selected_organisations",
      organisationIds: !isAdmin
        ? profile.organisationId
          ? [profile.organisationId]
          : []
        : isProgramme || audienceMode === "cohort"
          ? []
          : targetIds,
      attendanceRule: isProgramme
        ? "compulsory"
        : (String(
            data.get("attendanceRule"),
          ) as ScheduleItem["attendanceRule"]),
      startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
      endsAt: endsAt
        ? new Date(endsAt).toISOString()
        : startsAt
          ? new Date(
              new Date(startsAt).getTime() + 60 * 60 * 1000,
            ).toISOString()
          : undefined,
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
          ? String(data.get("meetingStatus")) || "Open"
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
            : "Add a cohort-wide item or target it to one startup. It will begin as proposed."}
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
                onChange={(event) =>
                  setItemType(event.target.value as ItemType)
                }
              >
                {Object.entries(itemMeta)
                  .filter(([value]) => isAdmin || value !== "lvnc_core")
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
                <FieldLabel>Audience</FieldLabel>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAudienceMode("cohort")}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-sm font-semibold",
                      audienceMode === "cohort"
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 text-slate-600",
                    )}
                  >
                    Whole cohort
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudienceMode("selected")}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-sm font-semibold",
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
              </div>
            )}
            <div>
              <FieldLabel>Starts *</FieldLabel>
              <Input
                type="datetime-local"
                name="startsAt"
                required
                value={
                  startValue
                    ? format(new Date(startValue), "yyyy-MM-dd'T'HH:mm")
                    : ""
                }
                onChange={(event) => {
                  setStartValue(event.target.value);
                }}
              />
            </div>
            <div>
              <FieldLabel>Ends *</FieldLabel>
              <Input
                type="datetime-local"
                name="endsAt"
                required
                value={
                  endValue
                    ? format(new Date(endValue), "yyyy-MM-dd'T'HH:mm")
                    : ""
                }
                onChange={(event) => {
                  setEndValue(event.target.value);
                }}
              />
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
                  <Input name="meetingStatus" defaultValue={item?.meetingStatus ?? "Open"} />
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
            <Button type="submit" variant="indigo">
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
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const startsAt = allDay
      ? `${data.get("startDate")}T00:00`
      : String(data.get("startsAt"));
    const endsAt = allDay
      ? `${data.get("endDate")}T23:59`
      : String(data.get("endsAt"));
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
          Mark travel, internal work, or unavailable time. LVCN can see the
          note; other startups cannot.
        </DialogDescription>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <FieldLabel>What is blocked?</FieldLabel>
            <Input name="title" required placeholder="e.g. Travel to the UK" />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(event) => setAllDay(event.target.checked)}
            />
            All-day or multi-day block
          </label>
          {allDay ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>First unavailable date</FieldLabel>
                <Input name="startDate" type="date" required />
              </div>
              <div>
                <FieldLabel>Last unavailable date</FieldLabel>
                <Input name="endDate" type="date" required />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Starts</FieldLabel>
                <Input name="startsAt" type="datetime-local" required />
              </div>
              <div>
                <FieldLabel>Ends</FieldLabel>
                <Input name="endsAt" type="datetime-local" required />
              </div>
            </div>
          )}
          <div>
            <FieldLabel>Note for LVCN</FieldLabel>
            <Input
              name="note"
              placeholder="e.g. Flight cancelled; available from 8 October"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="indigo">
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
