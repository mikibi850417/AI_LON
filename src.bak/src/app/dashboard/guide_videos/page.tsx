"use client";

import { useState } from "react";
import { Box } from "@mui/material";
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';

interface VideoData {
  id: string;
  title: string;
  description: string;
}

export default function GuideVideosPage() {
  const videos: VideoData[] = [
    {
      id: "FHUEOLGhRrw",
      title: "소개 영상",
      description: "Intelligent L.O.N 회사를 소개합니다."
    },
    {
      id: "fe3hNqUWDyE",
      title: "웹가이드 영상",
      description: "웹사이트 사용 방법에 대한 상세한 가이드입니다."
    },
    {
      id: "MfZd0KZZXMU",
      title: "데이터 활용 가이드 영상",
      description: "데이터를 효과적으로 활용하는 방법을 안내합니다."
    }
  ];

  const [activeVideo, setActiveVideo] = useState<string>(videos[0].id);

  return (
    <Box sx={{
      padding: { xs: '16px', md: '24px' },
      maxWidth: '1400px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      minHeight: 'calc(100vh - 100px)'
    }}>
      {/* 헤더 섹션 */}
      <h1 className="text-2xl font-bold mb-4" style={{
        color: '#2c3e50',
        padding: '16px 0',
        borderBottom: '2px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center'
      }}>
        <VideoLibraryIcon style={{ marginRight: '8px', color: '#2c3e50' }} />
        Guide Videos
      </h1>

      {/* 메인 콘텐츠 영역 */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '100%'
      }}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 메인 비디오 플레이어 */}
          <div className="lg:col-span-2 bg-[#2c3e50] rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
            <div className="aspect-video w-full">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${activeVideo}?autoplay=0&rel=0`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2 text-white">
                {videos.find(v => v.id === activeVideo)?.title}
              </h2>
              <p className="text-gray-200">
                {videos.find(v => v.id === activeVideo)?.description}
              </p>
            </div>
          </div>

          {/* 비디오 목록 */}
          <div className="lg:col-span-1">
            <div className="bg-[#2c3e50] rounded-2xl p-6 border border-gray-700 shadow-xl h-full">
              <h3 className="text-xl font-semibold mb-6 text-center text-white">All Guide Videos</h3>
              <div className="space-y-4">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      activeVideo === video.id
                        ? "bg-gradient-to-r from-blue-600/40 to-purple-600/40 border border-blue-500/50"
                        : "bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700"
                    }`}
                    onClick={() => setActiveVideo(video.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-24 h-16 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{video.title}</h4>
                        <p className="text-sm text-gray-200 line-clamp-1">{video.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Box>
    </Box>
  );
}
