# Quản lý AI Models

## Tổng quan
Hệ thống sử dụng một cấu hình tập trung để quản lý danh sách các AI models. Thay vì hardcode tên models trong từng view, tất cả thông tin models được lưu trữ trong file `appsettings.json`.

## Cấu trúc

### 1. Cấu hình Models (appsettings.json)
```json
{
  "AIModels": {
    "Models": [
      {
        "Id": "gemini-2.5-flash-preview-04-17",
        "DisplayName": "Gemini 2.5 Flash Preview",
        "IsDefault": true
      },
      {
        "Id": "llama-3.3-70b-versatile", 
        "DisplayName": "Llama 3.3 70B Versatile",
        "IsDefault": false
      }
    ]
  }
}
```

### 2. Model Classes
- `AIModel`: Đại diện cho một AI model
- `AIModelsConfiguration`: Chứa danh sách các models

### 3. Service
- `IAIModelService`: Interface để quản lý models
- `AIModelService`: Implementation cung cấp các phương thức:
  - `GetAllModels()`: Lấy tất cả models
  - `GetDefaultModel()`: Lấy model mặc định
  - `GetModelById(string id)`: Lấy model theo ID
  - `GetDefaultModelId()`: Lấy ID của model mặc định

### 4. Partial Views
- `_ModelSelector.cshtml`: Dropdown cho việc chọn 2 models (dùng cho Home và Exam)
- `_SyllabusModelSelector.cshtml`: Dropdown với layout đặc biệt cho Syllabus (có nút Generate)

## Cách thay đổi/thêm models

### Thêm model mới:
1. Mở file `appsettings.json`
2. Thêm object mới vào mảng `Models`:
```json
{
  "Id": "tên-model-mới",
  "DisplayName": "Tên hiển thị cho model",
  "IsDefault": false
}
```

### Thay đổi model mặc định:
1. Tìm model hiện tại có `"IsDefault": true`
2. Đổi thành `"IsDefault": false`
3. Đặt model muốn làm mặc định thành `"IsDefault": true`

### Xóa model:
1. Xóa object model tương ứng khỏi mảng `Models`

### Cập nhật tên model:
1. Thay đổi `Id` hoặc `DisplayName` của model tương ứng

## Lợi ích
- **Quản lý tập trung**: Chỉ cần sửa một file để thay đổi toàn bộ hệ thống
- **Dễ bảo trì**: Không cần sửa multiple views khi thay đổi models
- **Linh hoạt**: Có thể dễ dàng thêm/xóa models
- **Consistency**: Đảm bảo tất cả views sử dụng cùng danh sách models
- **Type-safe**: Sử dụng strongly-typed models thay vì magic strings

## Sử dụng trong Controllers
Controllers tự động inject `IAIModelService` và truyền danh sách models qua `ViewBag.Models` để các partial views có thể sử dụng.

## Lưu ý
- Đảm bảo ít nhất một model có `IsDefault: true`
- `Id` của model phải unique
- `Id` cần khớp với tên model được API backend hỗ trợ 