import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, LogOut, MessageSquare, Plus, Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface KnowledgeBaseItem {
  id: string;
  title: string;
  content: string;
  category: string | null;
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseItem[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newItem, setNewItem] = useState({ title: "", content: "", category: "" });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchKnowledgeBase();
    }
  }, [user]);

  const fetchKnowledgeBase = async () => {
    const { data, error } = await supabase
      .from("knowledge_base_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load knowledge base",
      });
    } else {
      setKnowledgeBase(data || []);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    const { error } = await supabase.from("knowledge_base_items").insert({
      user_id: user.id,
      title: newItem.title,
      content: newItem.content,
      category: newItem.category || null,
    });

    setIsSubmitting(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add knowledge base item",
      });
    } else {
      toast({
        title: "Success",
        description: "Knowledge base item added",
      });
      setNewItem({ title: "", content: "", category: "" });
      setIsAddDialogOpen(false);
      fetchKnowledgeBase();
    }
  };

  const handleDeleteItem = async (id: string) => {
    const { error } = await supabase
      .from("knowledge_base_items")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete item",
      });
    } else {
      toast({
        title: "Deleted",
        description: "Item removed from knowledge base",
      });
      fetchKnowledgeBase();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Multi-Tenant Chatbot</h1>
              <p className="text-sm text-muted-foreground">Tenant ID: {user?.id.slice(0, 8)}...</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/chat")} variant="default">
              <MessageSquare className="mr-2 h-4 w-4" />
              Open Chat
            </Button>
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Knowledge Base</h2>
              <p className="text-muted-foreground">
                Manage your domain-specific knowledge. Your chatbot will use this data to answer questions.
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Knowledge
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Knowledge Base Item</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddItem} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newItem.title}
                      onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category (optional)</Label>
                    <Input
                      id="category"
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={newItem.content}
                      onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                      rows={6}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Item
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {knowledgeBase.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">No knowledge base items yet</p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Item
                </Button>
              </CardContent>
            </Card>
          ) : (
            knowledgeBase.map((item) => (
              <Card key={item.id} className="animate-fade-in">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      {item.category && (
                        <CardDescription className="mt-1">
                          {item.category}
                        </CardDescription>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-4">
                    {item.content}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;