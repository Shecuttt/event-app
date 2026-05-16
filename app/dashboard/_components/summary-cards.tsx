import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, DollarSign, FileText } from "lucide-react";

interface SummaryCardsProps {
  stats: {
    published: number;
    draft: number;
    totalAttendees: number;
    totalRevenue: number;
  };
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  const items = [
    {
      title: "Event Aktif",
      value: stats.published,
      icon: Calendar,
      description: "Event yang sedang tayang",
    },
    {
      title: "Event Draft",
      value: stats.draft,
      icon: FileText,
      description: "Event belum dipublikasikan",
    },
    {
      title: "Total Peserta",
      value: stats.totalAttendees,
      icon: Users,
      description: "Dari semua event",
    },
    {
      title: "Total Revenue",
      value: new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(stats.totalRevenue),
      icon: DollarSign,
      description: "Pendapatan kotor",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <item.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
