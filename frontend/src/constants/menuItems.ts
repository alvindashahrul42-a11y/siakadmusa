import {
  LayoutDashboard,
  UserCircle,
  BookOpen,
  Calendar,
  ClipboardList,
  FileText,
  Settings,
  GraduationCap,
  Image,
  Building,
  Building2,
  Dumbbell,
  CalendarDays,
  Trophy,
  Newspaper,
  Layers,
  Globe,
  School,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface MenuItem {
  name: string;
  title: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
}

export interface MenuGroup {
  name: string;
  title: string;
  icon: LucideIcon;
  roles?: string[];
  /** Standalone item tanpa submenu (Dashboard, Pengaturan) */
  href?: string;
  /** Child items di dalam group */
  children?: MenuItem[];
}

// ─── Standalone items ──────────────────────────────────────────────────────────
export const STANDALONE_TOP: MenuGroup = {
  name: "dashboard",
  title: "Dashboard",
  href: "/dashboard",
  icon: LayoutDashboard,
  roles: ["superuser", "teacher", "student"],
};

export const STANDALONE_BOTTOM: MenuGroup = {
  name: "settings",
  title: "Pengaturan",
  href: "/dashboard/settings",
  icon: Settings,
  roles: ["superuser"],
};

// ─── Group: Landing Page ───────────────────────────────────────────────────────
export const LANDING_PAGE_GROUP: MenuGroup = {
  name: "landing-page",
  title: "Landing Page",
  icon: Globe,
  roles: ["superuser"],
  children: [
    {
      name: "hero-slides",
      title: "Hero Slide",
      href: "/dashboard/hero-slides",
      icon: Image,
      roles: ["superuser"],
    },
    {
      name: "school-profile",
      title: "Profil Sekolah",
      href: "/dashboard/school-profile",
      icon: Building,
      roles: ["superuser"],
    },
    {
      name: "school-facilities",
      title: "Fasilitas Sekolah",
      href: "/dashboard/school-facilities",
      icon: Building2,
      roles: ["superuser"],
    },
    {
      name: "school-programs",
      title: "Program Unggulan",
      href: "/dashboard/school-programs",
      icon: Layers,
      roles: ["superuser"],
    },
    {
      name: "extracurriculars",
      title: "Ekstrakurikuler",
      href: "/dashboard/extracurriculars",
      icon: Dumbbell,
      roles: ["superuser"],
    },
    {
      name: "school-activities",
      title: "Kegiatan Sekolah",
      href: "/dashboard/school-activities",
      icon: CalendarDays,
      roles: ["superuser"],
    },
    {
      name: "school-achievements",
      title: "Prestasi Sekolah",
      href: "/dashboard/school-achievements",
      icon: Trophy,
      roles: ["superuser"],
    },
    {
      name: "articles",
      title: "Artikel & Berita",
      href: "/dashboard/articles",
      icon: Newspaper,
      roles: ["superuser"],
    },
  ],
};

// ─── Group: Akademik ───────────────────────────────────────────────────────────
export const AKADEMIK_GROUP: MenuGroup = {
  name: "akademik",
  title: "Akademik",
  icon: School,
  roles: ["superuser", "teacher", "student"],
  children: [
    {
      name: "users",
      title: "Data Pengguna",
      href: "/dashboard/users",
      icon: UserCircle,
      roles: ["superuser", "teacher"],
    },
    {
      name: "students",
      title: "Data Siswa",
      href: "/dashboard/students",
      icon: GraduationCap,
      roles: ["superuser", "teacher"],
    },
    {
      name: "teachers",
      title: "Data Guru",
      href: "/dashboard/teachers",
      icon: UserCircle,
      roles: ["superuser", "teacher"],
    },
    {
      name: "subjects",
      title: "Mata Pelajaran",
      href: "/dashboard/subjects",
      icon: BookOpen,
      roles: ["superuser", "teacher"],
    },
    {
      name: "schedule",
      title: "Jadwal",
      href: "/dashboard/schedule",
      icon: Calendar,
      roles: ["superuser", "teacher", "student"],
    },
    {
      name: "grades",
      title: "Nilai",
      href: "/dashboard/grades",
      icon: ClipboardList,
      roles: ["superuser", "teacher", "student"],
    },
    {
      name: "reports",
      title: "Laporan",
      href: "/dashboard/reports",
      icon: FileText,
      roles: ["superuser", "teacher"],
    },
  ],
};

// ─── All groups (urutan render) ────────────────────────────────────────────────
export const MENU_GROUPS: MenuGroup[] = [
  STANDALONE_TOP,
  LANDING_PAGE_GROUP,
  AKADEMIK_GROUP,
  STANDALONE_BOTTOM,
];

// ─── Flat list (backward-compat untuk helper functions) ───────────────────────
export const MENU_ITEMS: MenuItem[] = [
  { name: "dashboard", title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["superuser", "teacher", "student"] },
  { name: "settings",  title: "Pengaturan", href: "/dashboard/settings", icon: Settings, roles: ["superuser"] },
  ...(LANDING_PAGE_GROUP.children ?? []),
  ...(AKADEMIK_GROUP.children ?? []),
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

export const hasMenuAccess = (menuRoles?: string[], userRole?: string): boolean => {
  if (!menuRoles || menuRoles.length === 0) return true;
  if (!userRole) return false;
  return menuRoles.some((r) => r.toLowerCase() === userRole.toLowerCase());
};

/** Filter children di dalam group berdasarkan role */
export const getFilteredMenuGroups = (userRole?: string): MenuGroup[] => {
  return MENU_GROUPS
    .filter((group) => hasMenuAccess(group.roles, userRole))
    .map((group) => {
      if (!group.children) return group;
      const filtered = group.children.filter((item) =>
        hasMenuAccess(item.roles, userRole)
      );
      return { ...group, children: filtered };
    })
    // Buang group yang punya children array tapi kosong setelah filter
    .filter((group) => !group.children || group.children.length > 0);
};

/** Cari item aktif berdasarkan pathname (cek flat di semua children) */
export const getMenuItemByPath = (pathname: string): {
  menuItem: MenuItem | undefined;
  groupName: string | undefined;
} => {
  // Cek children dulu (lebih spesifik), baru standalone
  for (const group of MENU_GROUPS) {
    if (group.children) {
      for (const item of group.children) {
        if (pathname === item.href || pathname.startsWith(item.href + "/")) {
          return { menuItem: item, groupName: group.name };
        }
      }
    }
  }

  // Baru cek standalone (Dashboard, Pengaturan)
  for (const group of MENU_GROUPS) {
    if (group.href && !group.children) {
      if (pathname === group.href) {
        return {
          menuItem: { name: group.name, title: group.title, href: group.href!, icon: group.icon, roles: group.roles },
          groupName: group.name,
        };
      }
    }
  }

  return { menuItem: undefined, groupName: undefined };
};

// Alias lama agar file lain yang masih import getFilteredMenuItems tidak error
export const getFilteredMenuItems = (userRole?: string): MenuItem[] => {
  return getFilteredMenuGroups(userRole).flatMap((group) =>
    group.children
      ? group.children
      : [{ name: group.name, title: group.title, href: group.href!, icon: group.icon, roles: group.roles }]
  );
};

export const getMenuItemByName = (name: string): MenuItem | undefined =>
  MENU_ITEMS.find((item) => item.name === name);
