import { ProjectDetailsResponse } from '@/services/projectApi';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  MapPin, 
  Phone, 
  User, 
  Calendar, 
  CheckCircle, 
  Wrench,
  Camera,
} from 'lucide-react';

interface ProjectReportViewProps {
  details: ProjectDetailsResponse;
}

const ProjectReportView = ({ details }: ProjectReportViewProps) => {
  const { project, summary, calls } = details;

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto print:p-0 print:m-0" id="project-report">
      {/* Report Header */}
      <div className="flex justify-between items-start border-b-2 border-primary pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{project.project_name}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Project Completion Report • {new Date().toLocaleDateString()}
          </p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <p className="font-semibold text-foreground uppercase tracking-wider mb-1">Status</p>
          <Badge variant="outline" className="bg-success/10 text-success border-success/30 font-bold uppercase tracking-tight">
            {project.status || 'REPORT'}
          </Badge>
        </div>
      </div>

      {/* Project Metadata Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-muted/30 p-4 rounded-xl border">
          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Support Type</p>
          <p className="font-semibold flex items-center gap-2 text-primary">
            <Wrench className="h-4 w-4" />
            {project.support_type}
          </p>
        </div>
        <div className="bg-muted/30 p-4 rounded-xl border">
          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Total Calls</p>
          <p className="font-semibold flex items-center gap-2 text-foreground">
            <Phone className="h-4 w-4" />
            {summary.total_calls} Calls
          </p>
        </div>
        <div className="bg-muted/30 p-4 rounded-xl border">
          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Completion Status</p>
          <p className="font-semibold flex items-center gap-2 text-success">
            <CheckCircle className="h-4 w-4" />
            {summary.completed_calls} / {summary.total_calls} Done
          </p>
        </div>
        <div className="bg-muted/30 p-4 rounded-xl border">
          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Serviceable Sites</p>
          <p className="font-semibold flex items-center gap-2 text-primary">
            <Building2 className="h-4 w-4" />
            {summary.serviceable_calls} Sites
          </p>
        </div>
        <div className="bg-muted/30 p-4 rounded-xl border">
          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Creation Date</p>
          <p className="font-semibold flex items-center gap-2 text-foreground">
            <Calendar className="h-4 w-4" />
            {new Date(project.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* L1 Support Info */}
      <Card className="mb-10 bg-primary/5 border-primary/20 print:bg-transparent">
        <CardContent className="p-4 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
             </div>
             <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Primary Contact</p>
                <p className="text-sm font-semibold">{project.l1_support_name || 'N/A'}</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Phone className="h-4 w-4 text-primary" />
             </div>
             <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Contact Number</p>
                <p className="text-sm font-semibold">{project.l1_support_number || 'N/A'}</p>
             </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Call Records Section */}
      <h2 className="text-xl font-bold text-foreground mb-6 uppercase tracking-tight flex items-center gap-2">
        <Building2 className="h-5 w-5 text-primary" />
        Detailed Call Proofs & Records
      </h2>

      <div className="space-y-10">
        {calls.filter(c => {
          const s = c.status?.toUpperCase();
          return ['COMPLETED', 'FINISH', 'SUCCESS', 'DONE'].includes(s || '');
        }).map((call, idx) => {
          const displayImages = call.proof_images && call.proof_images.length > 0
            ? call.proof_images
            : ((call as any).images || (call as any).photos || []);

          return (
            <div key={call.call_id} className="border rounded-2xl p-6 bg-white overflow-hidden break-inside-avoid">
            {/* Call Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                   <span className="text-primary text-sm font-mono opacity-50">#{idx + 1}</span>
                   {call.branch_name}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                   <MapPin className="h-3 w-3" />
                   {call.branch_code} • {call.address || call.pincode}
                </p>
              </div>
              <Badge variant="outline" className="bg-success/5 text-success border-success/30 text-[10px] font-bold">
                 COMPLETED
              </Badge>
            </div>

            {/* Call Details Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6 text-xs border-y py-3 border-dashed">
               <div>
                  <p className="text-muted-foreground mb-0.5">Asset Type</p>
                  <p className="font-semibold text-foreground uppercase">{call.asset_type || 'N/A'}</p>
               </div>
               <div>
                  <p className="text-muted-foreground mb-0.5">Asset Count</p>
                  <p className="font-semibold text-foreground">{call.asset_count ?? 0} Assets</p>
               </div>
               <div>
                  <p className="text-muted-foreground mb-0.5">Service Date</p>
                  <p className="font-semibold text-foreground">
                    {call.completed_at ? new Date(call.completed_at).toLocaleDateString() : 'N/A'}
                  </p>
               </div>
            </div>

            {/* Proof Gallery */}
            {displayImages && displayImages.length > 0 ? (
              <div>
                 <div className="flex items-center gap-2 mb-3 text-primary/70">
                    <Camera className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Image Evidence (Proofs)</span>
                 </div>
                 <div className="grid grid-cols-3 gap-3">
                   {displayImages.map((img: string, i: number) => (
                     <div key={i} className="aspect-square rounded-lg overflow-hidden border bg-muted group relative">
                        <img 
                          src={img} 
                          alt={`Proof Case ${i+1}`} 
                          className="h-full w-full object-cover"
                          onError={(e) => (e.currentTarget.src = 'https://placehold.co/400x400?text=Image+Load+Failed')}
                        />
                     </div>
                   ))}
                 </div>
              </div>
            ) : (
              <div className="bg-muted/20 rounded-lg p-4 text-center border border-dashed">
                 <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">No Image Evidence Provided</p>
              </div>
            )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-20 pt-8 border-t border-dashed text-center text-xs text-muted-foreground">
         <p>© {new Date().getFullYear()} Door2Fy • Verified Project Execution Report</p>
         <p className="mt-1">Generated by Vendor Workspace</p>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          #project-report {
            padding: 0 !important;
            box-shadow: none !important;
          }
          .break-inside-avoid {
            break-inside: avoid;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProjectReportView;
