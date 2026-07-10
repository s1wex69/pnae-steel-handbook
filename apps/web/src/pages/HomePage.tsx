import { Link } from "react-router-dom";
import {
  Calculator,
  BookOpen,
  Scale,
  GraduationCap,
  Library,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SECTIONS = [
  {
    to: "/calculators",
    title: "Калькуляторы",
    desc: "Интерактивные расчёты сосудов, фланцев, трубопроводов и узлов",
    icon: Calculator,
    color: "text-blue-400",
  },
  {
    to: "/handbooks/pnae-steel",
    title: "ПНАЭ",
    desc: "Свойства сталей, допускаемые напряжения, Rm, Rp0,2, E и α",
    icon: BookOpen,
    color: "text-[var(--color-emphasis)]",
  },
  {
    to: "/gosts",
    title: "ГОСТы",
    desc: "Нормативные таблицы с фильтрацией и копированием",
    icon: Scale,
    color: "text-amber-400",
  },
  {
    to: "/examples",
    title: "Примеры расчётов",
    desc: "Готовые примеры задач с нормативными ссылками",
    icon: GraduationCap,
    color: "text-rose-400",
  },
  {
    to: "/glossary",
    title: "Глоссарий",
    desc: "Термины прочности, допускаемых напряжений и коэффициентов запаса",
    icon: Library,
    color: "text-cyan-400",
  },
];

export function HomePage() {
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-card)] to-[var(--color-accent)] p-8 md:p-12">
        <div className="relative z-10 max-w-2xl space-y-4">
          <p className="text-sm font-medium uppercase tracking-wider text-[var(--color-primary)]">
            Инженерная платформа
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Расчёты на прочность для механиков и проектировщиков
          </h1>
          <p className="text-[var(--color-muted-foreground)] md:text-lg">
            Калькуляторы по ГОСТ и ПНАЭ, справочник свойств сталей и интерактивные нормативные
            таблицы — в одном современном интерфейсе.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/calculators">
                Калькуляторы
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/handbooks/pnae-steel">Справочник ПНАЭ</Link>
            </Button>
          </div>
        </div>
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--color-primary)] opacity-10 blur-3xl"
          aria-hidden
        />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Разделы платформы</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map(({ to, title, desc, icon: Icon, color }) => (
            <Link key={to} to={to} className="group">
              <Card className="h-full transition-shadow hover:shadow-md group-hover:border-[var(--color-primary)]/40">
                <CardHeader>
                  <Icon className={`h-8 w-8 ${color}`} />
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-sm text-[var(--color-primary)]">Перейти →</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
