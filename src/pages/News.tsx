import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";

const News = () => {
  const newsArticles = [
    {
      id: 1,
      title: "The Rise of Plant-Based Cuisine in 2024",
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600",
      category: "Trends",
      date: "2024-01-15",
      excerpt: "Discover how plant-based cooking is revolutionizing the culinary world with innovative techniques and flavors."
    },
    {
      id: 2,
      title: "Top 10 Superfoods to Add to Your Diet",
      image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600",
      category: "Health",
      date: "2024-01-14",
      excerpt: "Learn about the most nutritious foods that can boost your health and well-being in the new year."
    },
    {
      id: 3,
      title: "Street Food Culture: A Global Phenomenon",
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600",
      category: "Culture",
      date: "2024-01-13",
      excerpt: "Explore the vibrant world of street food and its impact on local communities around the globe."
    },
    {
      id: 4,
      title: "Sustainable Cooking: Reducing Food Waste",
      image: "https://images.unsplash.com/photo-1543362906-acfc16c67564?w=600",
      category: "Sustainability",
      date: "2024-01-12",
      excerpt: "Tips and techniques for minimizing food waste in your kitchen while creating delicious meals."
    },
    {
      id: 5,
      title: "The Art of Fermentation: Ancient Techniques",
      image: "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=600",
      category: "Techniques",
      date: "2024-01-11",
      excerpt: "Dive into the world of fermentation and learn how ancient preservation methods are making a comeback."
    },
    {
      id: 6,
      title: "Michelin Star Trends: What's Hot in Fine Dining",
      image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600",
      category: "Fine Dining",
      date: "2024-01-10",
      excerpt: "An inside look at the latest trends shaping the fine dining scene across the world."
    },
    {
      id: 7,
      title: "15 Grocery Hacks for Faster Weekly Shopping",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600",
      category: "Grocery",
      date: "2024-01-09",
      excerpt: "Save time and reduce costs with a smart aisle-by-aisle grocery strategy."
    },
    {
      id: 8,
      title: "Kitchen Tech Gadgets Worth Buying This Year",
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600",
      category: "Technology",
      date: "2024-01-08",
      excerpt: "From smart ovens to connected scales, these gadgets improve consistency in cooking."
    },
    {
      id: 9,
      title: "Healthy Lunchbox Ideas for Busy Professionals",
      image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600",
      category: "Health",
      date: "2024-01-07",
      excerpt: "Quick prep recipes with balanced macros for long workdays and commutes."
    },
    {
      id: 10,
      title: "Weekend Brunch Menu: 5 Crowd Favorites",
      image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600",
      category: "Recipes",
      date: "2024-01-06",
      excerpt: "Build a full brunch menu with easy mains, sides, and dessert pairings."
    },
    {
      id: 11,
      title: "How to Store Fresh Produce for Longer",
      image: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=600",
      category: "Kitchen Tips",
      date: "2024-01-05",
      excerpt: "Use humidity zones, vented containers, and prep methods to reduce spoilage."
    },
    {
      id: 12,
      title: "Street Snack Specials Trending Across India",
      image: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=600",
      category: "Culture",
      date: "2024-01-04",
      excerpt: "Regional snack innovations are blending tradition and modern presentation."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[400px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-secondary/80" />
        <img 
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200"
          alt="Food News"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
        />
        <div className="relative container h-full flex flex-col justify-center text-white">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-8 h-8" />
            <Badge variant="secondary" className="text-lg px-4 py-1">LIVE</Badge>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Food News & Updates
          </h1>
          <p className="text-xl md:text-2xl max-w-2xl">
            Stay updated with the latest trends, health tips, and culinary innovations
          </p>
        </div>
      </section>

      <div className="container py-12">
        <BackButton fallbackPath="/" />
        {/* Featured Article */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Featured Story</h2>
          <Card className="overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <img
                src="https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=800"
                alt="Featured"
                className="w-full h-full object-cover"
              />
              <CardContent className="p-8 flex flex-col justify-center">
                <Badge className="mb-4 w-fit">Breaking News</Badge>
                <h3 className="text-3xl font-bold mb-4">
                  Global Food Festival Announces 2024 Lineup
                </h3>
                <p className="text-muted-foreground mb-6 text-lg">
                  The world's largest food festival is set to showcase cuisines from over 50 countries, 
                  featuring celebrity chefs and innovative cooking demonstrations.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>January 15, 2024</span>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>

        {/* News Grid */}
        <div>
          <h2 className="text-3xl font-bold mb-8">Latest Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsArticles.map((article) => (
              <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-48 object-cover"
                />
                <CardContent className="p-6">
                  <Badge className="mb-3">{article.category}</Badge>
                  <h3 className="font-semibold text-xl mb-3 line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(article.date).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default News;
