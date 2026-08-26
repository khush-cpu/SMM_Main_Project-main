import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ArrowUpRight, Calendar, FileText, TrendingUp, Users, PenSquare, Loader2, AlertCircle, Eye, Share2, MessageCircle, Heart } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { useAuth } from "@/lib/auth";
import { apiGetPosts, apiGetOverview, type Post, type PostsOverviewByPlatform } from "@/lib/api";

const Overview = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsCounts, setPostsCounts] = useState({
    totalPosts: 0,
    draftPosts: 0,
    queuedPosts: 0,
    scheduledPosts: 0,
    publishedPosts: 0,
  });
  const [analytics, setAnalytics] = useState({
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    totalViews: 0,
    totalReach: 0,
    totalImpressions: 0,
    totalEngagement: 0,
    totalProfileViews: 0,
  });
  const [byPlatform, setByPlatform] = useState<PostsOverviewByPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.token) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [postsRes, overviewRes] = await Promise.all([
          apiGetPosts(user.token),
          apiGetOverview(user.token),
        ]);

        if (postsRes.error) {
          setError("Posts load nahi hue: " + postsRes.error);
        } else {
          const allPosts = postsRes.data?.posts ?? postsRes.data?.data ?? [];
          setPosts(allPosts);
        }

        if (overviewRes.error) {
          setError((prev) => prev ?? "Analytics load nahi hui: " + overviewRes.error);
        } else if (overviewRes.data?.data) {
          const d = overviewRes.data.data;
          if (d.posts) {
            setPostsCounts({
              totalPosts: d.posts.totalPosts ?? 0,
              draftPosts: d.posts.draftPosts ?? 0,
              queuedPosts: d.posts.queuedPosts ?? 0,
              scheduledPosts: d.posts.scheduledPosts ?? 0,
              publishedPosts: d.posts.publishedPosts ?? 0,
            });
          }
          if (d.analytics) {
            setAnalytics({
              totalLikes: d.analytics.totalLikes ?? 0,
              totalComments: d.analytics.totalComments ?? 0,
              totalShares: d.analytics.totalShares ?? 0,
              totalViews: d.analytics.totalViews ?? 0,
              totalReach: d.analytics.totalReach ?? 0,
              totalImpressions: d.analytics.totalImpressions ?? 0,
              totalEngagement: d.analytics.totalEngagement ?? 0,
              totalProfileViews: d.analytics.totalProfileViews ?? 0,
            });
            setByPlatform(d.analytics.byPlatform ?? []);
          }
        }
      } catch {
        setError("Network error — backend check karo");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.token]);

  const stats = [
    { label: "Scheduled", value: postsCounts.scheduledPosts, icon: Calendar, change: "" },
    { label: "Drafts", value: postsCounts.draftPosts, icon: FileText, change: "" },
    { label: "Engagement", value: analytics.totalEngagement.toLocaleString(), icon: TrendingUp, change: "" },
    { label: "Reach", value: analytics.totalReach.toLocaleString(), icon: Users, change: "" },
  ];

  const engagementBreakdown = [
    { label: "Likes", value: analytics.totalLikes, icon: Heart },
    { label: "Comments", value: analytics.totalComments, icon: MessageCircle },
    { label: "Shares", value: analytics.totalShares, icon: Share2 },
    { label: "Views", value: analytics.totalViews, icon: Eye },
  ];

  const platformChartData = byPlatform.map((p) => ({
    platform: p.platform,
    engagement: (p.likes ?? 0) + (p.comments ?? 0) + (p.shares ?? 0),
    reach: p.reach ?? 0,
  }));

  const recentPosts = posts.slice(0, 5);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back 👋</h1>
          <p className="text-sm text-muted-foreground">
            Here's what's happening across your channels.
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/compose">
            <PenSquare className="w-4 h-4 mr-2" /> Create post
          </Link>
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading dashboard...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s) => (
              <Card key={s.label} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                    <s.icon className="w-4 h-4 text-accent-foreground" />
                  </div>
                  {s.change && (
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" /> {s.change}
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Engagement by platform</h3>
                  <p className="text-xs text-muted-foreground">Likes + comments + shares, across connected platforms</p>
                </div>
              </div>
              <div className="h-64">
                {platformChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    No platform analytics yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platformChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="platform" stroke="hsl(var(--muted-foreground))" fontSize={12} className="capitalize" />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                        }}
                      />
                      <Bar dataKey="engagement" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t">
                {engagementBreakdown.map((e) => (
                  <div key={e.label} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                      <e.icon className="w-4 h-4 text-accent-foreground" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{e.value.toLocaleString()}</div>
                      <div className="text-[11px] text-muted-foreground">{e.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Recent posts</h3>
              <div className="space-y-3">
                {recentPosts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No posts yet. Create your first post!
                  </p>
                ) : (
                  recentPosts.map((p) => (
                    <div key={p._id ?? p.id} className="border rounded-lg p-3">
                      <p className="text-sm truncate text-slate-700">{p.content}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge
                          variant={p.status === "published" ? "default" : "secondary"}
                          className="text-xs capitalize"
                        >
                          {p.status}
                        </Badge>
                        {p.platforms?.slice(0, 2).map((pl) => (
                          <span key={pl} className="text-xs text-muted-foreground capitalize">
                            {pl}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {posts.length > 5 && (
                <Link
                  to="/dashboard/calendar"
                  className="mt-4 block text-xs text-primary hover:underline font-medium"
                >
                  View all posts →
                </Link>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Overview;
