
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/toast";
import AdminTableSelector from "./admin/AdminTableSelector";
import CaseManagement from "./admin/CaseManagement";
import BannerManagement from "./admin/BannerManagement";
import AddItemForm from "./admin/AddItemForm";
import AdminTable from "./admin/AdminTable";
import UserDuplicatesCleaner from "./admin/UserDuplicatesCleaner";
import UserManagement from "./admin/UserManagement";
import PromoCodeManagement from "./admin/PromoCodeManagement";
import SuspiciousActivityManagement from "./admin/SuspiciousActivityManagement";
import DatabaseImageCleanup from "./admin/DatabaseImageCleanup";
import type { TableName, RealTableName } from "@/types/admin";
import { Case, Skin } from "@/utils/supabaseTypes";
import QuizManagement from './admin/QuizManagement';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CaseSkinManagement from './admin/CaseSkinManagement';

const isRealTable = (table: TableName): table is RealTableName => {
  return table !== 'users' && table !== 'suspicious_activities';
}

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Админ-панель</h1>
      
      <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="users">Пользователи</TabsTrigger>
          <TabsTrigger value="cases">Кейсы</TabsTrigger>
          <TabsTrigger value="case_skins">Скины в кейсах</TabsTrigger>
          <TabsTrigger value="banners">Баннеры</TabsTrigger>
          <TabsTrigger value="promo">Промокоды</TabsTrigger>
          <TabsTrigger value="quiz">Викторина</TabsTrigger>
          <TabsTrigger value="tools">Инструменты</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
        <TabsContent value="cases">
          <CaseManagement 
            tableData={[]}
            selectedCase={null}
            setSelectedCase={() => {}}
            uploadingImage={false}
            onSkinImageUpload={async () => ''}
          />
        </TabsContent>
        <TabsContent value="case_skins">
          <div className="text-white">Case Skins Management - Coming Soon</div>
        </TabsContent>
        <TabsContent value="banners">
            <BannerManagement />
        </TabsContent>
        <TabsContent value="promo">
          <PromoCodeManagement />
        </TabsContent>
        <TabsContent value="quiz">
          <QuizManagement />
        </TabsContent>
        <TabsContent value="tools">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <UserDuplicatesCleaner />
            <DatabaseImageCleanup />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
