import { useNavigate } from "react-router-dom";
import { ArrowLeft, InfoIcon } from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };
  return (
    <Empty className="h-screen">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InfoIcon />
        </EmptyMedia>
        <EmptyTitle>Halaman Tidak Ditemukan</EmptyTitle>
        <EmptyDescription>Halaman yang antum cari gak ketemu</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Balik
        </Button>
      </EmptyContent>
    </Empty>
  );
}
