import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type BackButtonProps = {
  fallbackPath?: string;
};

const BackButton = ({ fallbackPath = "/" }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(fallbackPath);
  };

  return (
    <Button type="button" variant="outline" className="gap-2" onClick={handleBack}>
      <ArrowLeft className="w-4 h-4" />
      Back
    </Button>
  );
};

export default BackButton;
