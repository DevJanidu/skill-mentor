import {
  useSessions,
  useMentors,
  useSubjects,
  useStudents,
} from "@/hooks/use-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CalendarCheck, GraduationCap, Users } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export default function AdminDashboardPage() {
  const { data: sessions, isLoading: sl } = useSessions();
  const { data: mentors, isLoading: ml } = useMentors();
  const { data: subjects, isLoading: sbl } = useSubjects();
  const { data: students, isLoading: stl } = useStudents();

  const loading = sl || ml || sbl || stl;

  const stats = [
    {
      label: "Total Sessions",
      value: sessions?.length ?? 0,
      icon: CalendarCheck,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Total Mentors",
      value: mentors?.length ?? 0,
      icon: Users,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Total Subjects",
      value: subjects?.length ?? 0,
      icon: BookOpen,
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "Total Students",
      value: students?.length ?? 0,
      icon: GraduationCap,
      color: "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Admin Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Overview of the SkillMentor platform.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">
                {s.label}
              </CardTitle>
              <div className={`rounded-lg p-2 ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Spinner className="h-5 w-5 text-zinc-400" />
              ) : (
                <p className="text-3xl font-bold text-zinc-900">{s.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-6 w-6 text-zinc-400" />
            </div>
          ) : sessions && sessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-zinc-500">
                    <th className="pb-3 font-medium">ID</th>
                    <th className="pb-3 font-medium">Mentor</th>
                    <th className="pb-3 font-medium">Subject</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sessions.slice(0, 10).map((s) => (
                    <tr key={s.id} className="text-zinc-700">
                      <td className="py-3">#{s.id}</td>
                      <td className="py-3">{s.mentorName}</td>
                      <td className="py-3">{s.subjectName}</td>
                      <td className="py-3">{s.sessionType}</td>
                      <td className="py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            s.sessionStatus === "COMPLETED"
                              ? "bg-green-50 text-green-700"
                              : s.sessionStatus === "CANCELED"
                                ? "bg-red-50 text-red-700"
                                : s.sessionStatus === "STARTED"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          {s.sessionStatus}
                        </span>
                      </td>
                      <td className="py-3">
                        {new Date(s.sessionAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No sessions yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
