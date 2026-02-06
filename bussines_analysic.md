

# Quy Trình Quản Lý Hợp Đồng Cầm Đồ Đơn Giản Hóa

## 1. Cấu Trúc Mã QR Chuẩn Hóa

### 1.1 Định Dạng Mã QR

#### 1.1.1 Cấu trúc: [loại xe]-[loại hợp đồng]-[ngày tháng khởi tạo]-[số thứ tự hợp đồng trong ngày]

Cấu trúc mã QR được thiết kế theo định dạng chuẩn hóa gồm **bốn thành phần chính**, phân tách bằng dấu gạch ngang (-). Định dạng này thay thế hoàn toàn việc sử dụng UUID do hệ thống tạo ra, giải quyết vấn đề rủi ro về tính phụ thuộc vào cơ chế sinh ID tự động. UUID mặc dù đảm bảo tính duy nhất toàn cầu, nhưng tạo ra chuỗi ký tự dài 32-36 ký tự không mang ý nghĩa ngữ nghĩa, khó kiểm tra thủ công và khó phát hiện lỗi khi nhập liệu. Ngược lại, cấu trúc mã QR mới cho phép **nhân viên đọc và hiểu trực tiếp** thông tin cơ bản từ chính mã QR mà không cần tra cứu cơ sở dữ liệu, đặc biệt hữu ích trong các tình huống khẩn cấp hoặc khi hệ thống gặp sự cố.

Sự kết hợp của bốn thành phần đảm bảo **tính duy nhất tuyệt đối** trong phạm vi toàn hệ thống: không thể có hai hợp đồng cùng loại xe, cùng loại hợp đồng, cùng ngày và cùng số thứ tự. Đồng thời, cấu trúc này tạo điều kiện thuận lợi cho việc **phân loại, tìm kiếm và lọc hợp đồng** theo nhiều tiêu chí khác nhau mà không cần truy vấn phức tạp. Độ dài trung bình của mã QR khoảng 20-25 ký tự, nằm trong phạm vi lý tưởng cho QR code phiên bản 1-2, đảm bảo tốc độ quét và độ tin cậy cao ngay cả trong điều kiện ánh sáng kém hoặc bề mặt in không hoàn hảo.

#### 1.1.2 Ví dụ: CAR-RENTAL-20260206-01

Ví dụ cụ thể **"CAR-RENTAL-20260206-01"** minh họa cách mã QR được tạo ra trong thực tế:

| Thành phần | Giá trị | Ý nghĩa |
|:---|:---|:---|
| Loại xe | CAR | Ô tô con |
| Loại hợp đồng | RENTAL | Hợp đồng cho thuê/cầm đồ |
| Ngày khởi tạo | 20260206 | 06/02/2026 (định dạng YYYYMMDD) |
| Số thứ tự | 01 | Hợp đồng đầu tiên trong ngày |

Định dạng này cho phép nhân viên **nhận biết thông tin cơ bản ngay lập tức** mà không cần quét mã. Ví dụ, khi nhìn vào "CAR-RENTAL-20260206-01", nhân viên có thể xác định đây là hợp đồng thuê ô tô, tạo ngày 6/2/2026, là hợp đồng đầu tiên trong ngày. Điều này hỗ trợ đáng kể trong các tình huống xử lý thủ công khi hệ thống điện tử không khả dụng. Số thứ tự được định dạng với **hai chữ số có leading zero** (01, 02, ..., 99) để đảm bảo tính nhất quán về độ dài chuỗi, giúp các hệ thống xử lý chuỗi và cơ sở dữ liệu hoạt động hiệu quả hơn. Nếu khối lượng giao dịch vượt quá 99 hợp đồng/ngày/loại, có thể mở rộng thành ba chữ số (001-999) mà không ảnh hưởng đến cấu trúc tổng thể.

#### 1.1.3 Không sử dụng UUID hệ thống để tránh rủi ro

Quyết định **loại bỏ UUID** là bước đi chiến lược nhằm giảm thiểu các rủi ro vận hành và kỹ thuật. UUID (Universally Unique Identifier) tạo ra chuỗi 128-bit ngẫu nhiên, thường biểu diễn dưới dạng 32 ký tự hexadecimal như "550e8400-e29b-41d4-a716-446655440000". Mặc dù xác suất trùng lặp cực kỳ thấp, UUID mang theo nhiều hạn chế trong bối cảnh quản lý hợp đồng cầm đồ:

| Vấn đề với UUID | Tác động | Giải pháp của mã QR chuẩn hóa |
|:---|:---|:---|
| Không mang ý nghĩa ngữ nghĩa | Khó đọc, khó nhớ, cần tra cứu CSDL | Cấu trúc rõ ràng, đọc được trực tiếp |
| Phụ thuộc hoàn toàn vào hệ thống | Rủi ro khi hệ thống sự cố | Có thể tái tạo thủ công theo quy tắc |
| Khó truyền đạt qua điện thoại/tin nhắn | Dễ sai sót, mất thời gian | Ngắn gọn, dễ đọc, ít sai sót |
| Khó debug và xử lý sự cố | Cần truy vấn CSDL để hiểu thông tin | Suy luận được từ chính cấu trúc mã |

Việc sử dụng mã QR có cấu trúc cho phép **tái tạo thủ công** trong trường hợp khẩn cấp. Nếu biết ngày hiện tại và số thứ tự cuối cùng, nhân viên có thể tạo mã QR tiếp theo mà không cần hệ thống tự động. Điều này tạo ra **lớp dự phòng** quan trọng cho hoạt động liên tục của doanh nghiệp.

### 1.2 Thành Phần Mã QR

#### 1.2.1 Loại xe: Mã định danh phương tiện (CAR, MTR, v.v.)

Thành phần **loại xe** sử dụng các mã viết tắt chuẩn hóa 3-4 ký tự in hoa để đại diện cho từng loại phương tiện. Danh mục mã loại xe cần được định nghĩa rõ ràng trong tài liệu kỹ thuật và lập trình cứng trong hệ thống:

| Mã loại xe | Ý nghĩa | Ví dụ phương tiện | Ghi chú |
|:---|:---|:---|:---|
| **CAR** | Ô tô con | Toyota Camry, Honda Civic, Ford Ranger | Bao gồm cả xe bán tải nhỏ |
| **MTR** | Xe máy/mô tô | Honda Wave, Yamaha Exciter, Vespa | Xe số, tay ga, côn tay |
| **TRK** | Xe tải | Isuzu 5 tấn, Hino 300 series | Trên 1 tấn, có giấy phép kinh doanh |
| **VAN** | Xe van/thương mại | Toyota Hiace, Ford Transit | Chở hàng hoặc chở khách |
| **BIK** | Xe đạp/xe điện | Giant, Yamaha PAS, xe đạp điện | Có hoặc không có động cơ |
| **SPE** | Phương tiện đặc biệt | Thuyền, máy móc, thiết bị | Cần thẩm định riêng |

Việc sử dụng mã tiêu chuẩn hóa thay vì tên đầy đủ giúp **giảm độ dài mã QR, tăng tốc độ quét, và giảm lỗi nhận dạng**. Mỗi mã loại xe gắn liền với các quy định pháp lý và thủ tục cầm đồ cụ thể, đảm bảo tính tuân thủ trong quá trình xử lý hợp đồng. Khi có nhu cầu thêm loại phương tiện mới, danh mục có thể mở rộng mà không ảnh hưởng đến các mã hiện có.

#### 1.2.2 Loại hợp đồng: Phân loại giao dịch (RENTAL, SALE, v.v.)

Thành phần **loại hợp đồng** phân loại giao dịch cầm đồ, sử dụng các mã 4-8 ký tự in hoa:

| Mã loại hợp đồng | Ý nghĩa | Đặc điểm chính | Thời hạn điển hình |
|:---|:---|:---|:---|
| **RENTAL** | Cho thuê/cầm đồ | Khách cầm tài sản lấy tiền, có thể chuộc lại | 30-90 ngày |
| **SALE** | Mua bán có điều kiện | Bán tài sản, không quyền chuộc lại | Thanh toán ngay hoặc trả góp |
| **PAWN** | Cầm đồ truyền thống | Thế chấp tài sản, lãi suất cố định | Theo quy định pháp luật |
| **LEASE** | Thuê dài hạn | Cho thuê tài sản, khách trả tiền định kỳ | 6-24 tháng |
| **CONSIGN** | Ký gửi bán | Chủ sở hữu giữ quyền, bán hộ | Không cố định |

Phân loại này **quyết định các điều khoản hợp đồng, lãi suất, và quy trình xử lý khi đến hạn**. Việc mã hóa trực tiếp trong QR code giúp nhân viên nhanh chóng xác định quy trình áp dụng mà không cần tra cứu thông tin bổ sung. Điều này đặc biệt hữu ích khi xử lý hợp đồng ngoài giờ làm việc bình thường hoặc trong tình huống khẩn cấp.

#### 1.2.3 Ngày tháng khởi tạo: Định dạng YYYYMMDD

Thành phần **ngày tháng khởi tạo** sử dụng định dạng chuẩn **ISO 8601 cơ bản (YYYYMMDD)** với 8 chữ số liên tiếp. Định dạng này được ưu tiên vì nhiều lý do:

- **Tính không mơ hồ**: Loại bỏ nhầm lẫn giữa ngày/tháng (khác với DD/MM/YYYY hay MM/DD/YYYY)
- **Khả năng sắp xếp tự nhiên**: Chuỗi YYYYMMDD sắp xếp đúng thứ tự thời gian khi so sánh chuỗi
- **Tương thích cao**: Được hỗ trợ trực tiếp bởi hầu hết các hệ thống cơ sở dữ liệu và ngôn ngữ lập trình

Ví dụ: ngày **06/02/2026** được mã hóa thành **"20260206"**. Trong Python, việc chuyển đổi được thực hiện đơn giản bằng `datetime.now().strftime("%Y%m%d")`. Ngày khởi tạo đồng thời đóng vai trò **cơ sở cho việc reset số thứ tự**, đảm bảo tính duy nhất của mã trong phạm vi toàn hệ thống.

#### 1.2.4 Số thứ tự: Đếm tăng dần, reset mỗi ngày

Thành phần **số thứ tự** đảm bảo tính duy nhất của mã QR trong cùng một ngày, được định dạng với **số chữ số cố định** (thường 2 chữ số: 01-99). Cơ chế hoạt động:

| Trường hợp | Hành động | Kết quả |
|:---|:---|:---|
| Hợp đồng đầu tiên trong ngày | Reset về 01 | Số thứ tự = 01 |
| Hợp đồng tiếp theo cùng ngày | Tăng 1 đơn vị | Số thứ tự = 02, 03, ... |
| Sang ngày mới | Reset về 01 | Chu kỳ mới bắt đầu |

Việc **reset hàng ngày** giữ cho số thứ tự ngắn gọn, dễ đọc, và tạo mối liên hệ rõ ràng giữa số thứ tự với ngày giao dịch. Điều này hỗ trợ quá trình **đối soát cuối ngày** và quản lý kho lưu trữ giấy cầm đồ vật lý. Nếu khối lượng giao dịch vượt quá 99 hợp đồng/ngày/loại, có thể mở rộng thành 3 chữ số (001-999).

### 1.3 Cơ Chế Tạo Mã

#### 1.3.1 Không sử dụng HMAC-SHA256

Hệ thống **loại bỏ hoàn toàn HMAC-SHA256** - thuật toán mật mã thường dùng để xác thực tính toàn vẹn dữ liệu. Quyết định này dựa trên đánh giá chi phí-lợi ích:

| Yếu tố | Với HMAC-SHA256 | Không dùng HMAC-SHA256 |
|:---|:---|:---|
| Thời gian xử lý | Tăng do tính toán hash | Giảm đáng kể |
| Độ dài mã QR | Tăng 32-64 ký tự | Giữ nguyên 20-25 ký tự |
| Quản lý khóa | Cần cơ sở hạ tầng bảo mật | Không cần |
| Độ phức tạp triển khai | Cao | Thấp |
| Tính bảo mật | Mật mã học | Dựa vào kiểm soát vật lý |

Trong môi trường vận hành được kiểm soát với **kiểm soát truy cập vật lý, xác thực người dùng, và giám sát camera**, rủi ro giả mạo mã QR được đánh giá là thấp và có thể quản lý được thông qua các biện pháp phi kỹ thuật.

#### 1.3.2 Không thay thế bằng cơ chế bảo mật khác

Điểm quan trọng: **không có cơ chế bảo mật thay thế** nào được đưa vào. Điều này có nghĩa là:

- Không mã hóa đối xứng (AES, DES)
- Không mã hóa bất đối xứng (RSA, ECC)
- Không chữ ký số
- Không token xác thực
- Không steganography

Mã QR chứa thông tin ở **dạng plain text**, có thể đọc trực tiếp bằng bất kỳ trình quét QR code nào. Đơn giản hóa này phù hợp với môi trường nội bộ, nơi các biện pháp kiểm soát truy cập ở cấp độ ứng dụng đã đủ để bảo vệ thông tin. Tuy nhiên, điều này cũng có nghĩa là **mã QR không nên chứa thông tin nhạy cảm** như thông tin cá nhân khách hàng hoặc chi tiết tài chính.

#### 1.3.3 Tạo mã trực tiếp từ dữ liệu đầu vào

Quy trình tạo mã QR được thực hiện **trực tiếp bằng nối chuỗi**, không qua bất kỳ biến đổi nào:

```python
def generate_qr_code(vehicle_type, contract_type, sequence_number):
    from datetime import datetime
    date_str = datetime.now().strftime("%Y%m%d")
    qr_data = f"{vehicle_type}-{contract_type}-{date_str}-{sequence_number:02d}"
    return qr_data

# Ví dụ: generate_qr_code("CAR", "RENTAL", 1)
# Kết quả: "CAR-RENTAL-20260206-01"
```

Sự đơn giản này cho phép **dễ dàng gỡ lỗi, kiểm thử, và tái tạo mã** khi cần thiết. Trong trường hợp có sự cố hệ thống, mã QR có thể được tạo thủ công hoặc bằng công cụ bên ngoài mà vẫn đảm bảo tính nhất quán.

## 2. Hệ Thống Đếm Hợp Đồng

### 2.1 Phương Thức Count Trong Giấy Cầm Đồ

#### 2.1.1 Biến đếm gắn với hợp đồng

Hệ thống triển khai **biến đếm (counter variable)** được gắn trực tiếp với đối tượng hợp đồng trong quy trình xử lý giấy cầm đồ. Biến đếm này hoạt động như một **thuộc tính động**, tăng giá trị mỗi khi có hợp đồng mới được khởi tạo. Khác với sequence database hoặc auto-increment ID, biến đếm này được **quản lý ở tầng ứng dụng**, cho phép linh hoạt trong việc định nghĩa logic tăng và điều kiện reset.

Việc gắn biến đếm với đối tượng hợp đồng tạo ra **mối liên kết chặt chẽ giữa bản ghi điện tử và giấy cầm đồ vật lý**. Số thứ tự trên giấy in phải khớp với số thứ tự trong mã QR và trong cơ sở dữ liệu. Sự không khớp giữa bất kỳ hai thành phần nào đều là dấu hiệu của lỗi hệ thống hoặc gian lận, cần được điều tra ngay lập tức.

#### 2.1.2 Tăng tự động khi tạo hợp đồng mới

Cơ chế **tăng tự động** được kích hoạt tại thời điểm xác nhận tạo hợp đồng mới:

| Bước | Hành động | Mô tả |
|:---|:---|:---|
| 1 | Kiểm tra ngày hiện tại | So sánh với ngày của biến đếm |
| 2 | Quyết định tăng/reset | Cùng ngày → tăng 1; Khác ngày → reset về 1 |
| 3 | Cập nhật biến đếm | Thực hiện nguyên tử để tránh race condition |
| 4 | Tạo mã QR | Sử dụng giá trị đếm mới |
| 5 | Lưu hợp đồng | Đồng bộ với giấy cầm đồ vật lý |

Trong môi trường **đa luồng hoặc phân tán**, cần triển khai cơ chế khóa (locking) để đảm bảo chỉ có một giao dịch được tăng biến đếm tại một thời điểm. Các kỹ thuật như **SELECT FOR UPDATE** trong SQL, **atomic increment** trong Redis, hoặc **distributed lock** có thể được áp dụng tùy theo kiến trúc hệ thống.

#### 2.1.3 Reset số thứ tự đầu ngày

Cơ chế **reset tự động** khởi động lại bộ đếm về **01** khi bắt đầu ngày làm việc mới. Điểm reset có thể được cấu hình:

- **00:00 theo giờ hệ thống**: Đơn giản, nhất quán
- **Ca làm việc đầu tiên**: Phù hợp với giờ mở cửa thực tế
- **Lệnh thủ công**: Cho phép quản trị viên can thiệp khi cần

Việc reset theo ngày đảm bảo **số thứ tự không tăng vô hạn**, giữ độ dài mã QR ổn định, và tạo mối liên hệ rõ ràng giữa số thứ tự với ngày giao dịch. Trong trường hợp cần tạo hợp đồng cho ngày trong quá khứ hoặc tương lai, hệ thống cho phép **ghi đè cơ chế reset** với xác nhận của quản trị viên có thẩm quyền.

### 2.2 Quản Lý Số Thứ Tự Theo Ngày

#### 2.2.1 Lưu trữ ngày hiện tại

Hệ thống duy trì **biến trạng thái lưu trữ ngày hiện tại** để so sánh với ngày của các thao tác tạo hợp đồng. Ngày được lưu ở định dạng **YYYYMMDD**, đồng nhất với định dạng trong mã QR. Phương án lưu trữ:

| Phương án | Ưu điểm | Nhược điểm | Phù hợp khi |
|:---|:---|:---|:---|
| File văn bản | Đơn giản, nhanh, không phụ thuộc CSDL | Khó đồng bộ đa máy chủ | Hệ thống đơn lẻ, ít giao dịch |
| Cơ sở dữ liệu | Đồng bộ tốt, bền vững | Phụ thuộc kết nối CSDL | Hệ thống phân tán, nhiều giao dịch |
| Redis/Memcached | Tốc độ cao, hỗ trợ atomic operation | Phụ thuộc dịch vụ ngoài | Yêu cầu hiệu năng cao, real-time |

Việc lưu trữ ngày riêng biệt giúp **giảm tải và tăng tốc độ xử lý**, đặc biệt trong giờ cao điểm với nhiều giao dịch liên tiếp.

#### 2.2.2 So sánh ngày để quyết định reset

Thuật toán so sánh ngày được thực hiện **mỗi khi có yêu cầu tạo hợp đồng mới**:

```python
def get_next_sequence():
    current_date = datetime.now().strftime("%Y%m%d")
    saved_date, current_seq = read_counter_file()  # Đọc từ file/CSDL
    
    if current_date != saved_date:
        # Ngày mới - reset về 1
        new_seq = 1
        save_counter(current_date, new_seq)
    else:
        # Cùng ngày - tăng 1
        new_seq = current_seq + 1
        save_counter(current_date, new_seq)
    
    return new_seq
```

So sánh được thực hiện ở **mức chuỗi ký tự YYYYMMDD**, không phụ thuộc đối tượng datetime phức tạp, giúp tránh các vấn đề về múi giờ và định dạng. Trường hợp ngày hiện tại nhỏ hơn ngày đã lưu (do lỗi hệ thống) được xử lý như **trường hợp đặc biệt**, yêu cầu xác nhận của quản trị viên.

#### 2.2.3 Tăng biến đếm khi cùng ngày

Khi kết quả so sánh xác nhận **cùng ngày**, hệ thống thực hiện tăng biến đếm lên một đơn vị. Thao tác này được thiết kế **nguyên tử (atomic)** để tránh race condition:

- **File-based**: Sử dụng file lock hoặc ghi tạm rồi đổi tên
- **Database-based**: Sử dụng transaction với isolation level phù hợp
- **Redis-based**: Sử dụng lệnh `INCR` hoặc `INCRBY` nguyên tử

Giá trị đếm sau khi tăng được **định dạng với leading zero** (5 → "05" hoặc "005"), sau đó kết hợp với các thành phần khác để tạo chuỗi mã QR hoàn chỉnh.

## 3. Giao Diện Kiểm Tra và Ghi Log

### 3.1 Thông Tin Log Tối Thiểu

#### 3.1.1 Timestamp: Thời điểm thực hiện thao tác

Mỗi bản ghi log bắt buộc phải chứa **timestamp** xác định thời điểm thực hiện thao tác. Yêu cầu kỹ thuật:

| Thuộc tính | Giá trị | Mô tả |
|:---|:---|:---|
| Độ chính xác | Giây hoặc mili-giây | Tùy theo yêu cầu phân giải |
| Định dạng | ISO 8601 với múi giờ | Ví dụ: `2026-02-06T14:30:00+07:00` |
| Nguồn | Đồng hồ hệ thống server | Không cho phép chỉnh sửa thủ công |
| Múi giờ | Theo cấu hình hệ thống | Thường là UTC+7 cho Việt Nam |

Timestamp đóng vai trò **bằng chứng thời gian không thể chối cãi**, quan trọng cho việc xác minh quy trình, truy cứu trách nhiệm trong tranh chấp, và tính toán thời gian lưu kho để áp dụng phí. Trong môi trường phân tán, việc **đồng bộ đồng hồ giữa các node** (sử dụng NTP) là yêu cầu tiên quyết.

#### 3.1.2 ID nhân viên: Người thực hiện kiểm tra

**ID nhân viên** xác định rõ ràng người chịu trách nhiệm cho mỗi thao tác kiểm tra. Đặc điểm:

- Sử dụng **mã định danh duy nhất** trong hệ thống nhân sự (không phải tên hiển thị)
- Được **tự động điền** từ thông tin đăng nhập của phiên làm việc
- Không cho phép chỉnh sửa thủ công để tránh giả mạo

Việc ghi nhận ID nhân viên tạo **trách nhiệm giải trình (accountability)**, hỗ trợ điều tra khi có sự cố và cung cấp dữ liệu cơ bản cho phân tích hoạt động. Trong kiểm tra định kỳ, ID nhân viên được kết hợp với **GPS location** tạo thành bằng chứng định danh và định vị kép.

#### 3.1.3 ID hợp đồng: Hợp đồng được kiểm tra

**ID hợp đồng** trong log chính là **mã QR** đã được tạo, sử dụng định dạng chuẩn `[loại xe]-[loại hợp đồng]-[YYYYMMDD]-[số thứ tự]`. Sự kết hợp của **timestamp, ID nhân viên, và ID hợp đồng** tạo thành **khóa duy nhất** cho mỗi bản ghi log:

| Thành phần | Ví dụ | Ý nghĩa |
|:---|:---|:---|
| Timestamp | 2026-02-06T14:30:00+07:00 | Khi nào |
| ID nhân viên | NV001 | Ai làm |
| ID hợp đồng | CAR-RENTAL-20260206-01 | Đối tượng nào |

Cấu trúc này đảm bảo **không có sự trùng lặp** và hỗ trợ truy vết chính xác mọi hoạt động liên quan đến một hợp đồng cụ thể.

### 3.2 Loại Bỏ Thông Tin Không Cần Thiết

#### 3.2.1 Không ghi log chi tiết phức tạp

Hệ thống áp dụng nguyên tắc **"log tối thiểu"**, loại bỏ các thông tin thường thấy trong hệ thống phức tạp:

| Thông tin thường gặp | Trong hệ thống này | Lý do loại bỏ |
|:---|:---|:---|
| Địa chỉ IP | ❌ Không ghi | Giảm dung lượng, tăng tốc độ |
| User agent | ❌ Không ghi | Không cần thiết cho nội bộ |
| Session ID | ❌ Không ghi | Đơn giản hóa cấu trúc |
| Request parameters | ❌ Không ghi | Không cần tái hiện chi tiết |
| Response status | ❌ Không ghi | Không đánh giá kết quả |
| Thời gian xử lý | ❌ Không ghi | Không theo dõi hiệu năng |

Việc giảm thiểu thông tin log giúp **giảm dung lượng lưu trữ 80-90%**, **tăng tốc độ ghi và truy vấn 3-5 lần**, và **đơn giản hóa quá trình phân tích**. Tuy nhiên, điều này cũng có nghĩa là log không đủ thông tin để tái hiện chi tiết toàn bộ quá trình - cần kết hợp với các nguồn khác khi điều tra sự cố phức tạp.

#### 3.2.2 Không theo dõi metadata bổ sung

Ngoài ba thành phần cơ bản, hệ thống **không thu thập hoặc lưu trữ bất kỳ metadata bổ sung nào**:

- Không loại thao tác (trừ khi ngụ ý từ ngữ cảnh)
- Không mức độ ưu tiên
- Không trạng thái trước/sau
- Không tags phân loại
- Không thông tin thiết bị
- Không địa chỉ MAC, IMEI

Sự đơn giản này làm **giảm độ phức tạp của cấu trúc cơ sở dữ liệu**, loại bỏ nhu cầu index phức tạp, và cho phép sử dụng các giải pháp lưu trữ đơn giản như **file text hoặc JSON lines** thay vì cơ sở dữ liệu quan hệ. Trong trường hợp cần thông tin bổ sung, hệ thống dựa vào **tra cứu từ các bảng dữ liệu chính** dựa trên ID hợp đồng.

## 4. Quy Trình Tiếp Nhận Tài Sản

### 4.1 Yêu Cầu Hình Ảnh

#### 4.1.1 Chụp ảnh tài sản lúc nhận

Quy trình tiếp nhận tài sản **bắt buộc phải bao gồm bước chụp ảnh** tại thời điểm nhận. Đây là **yêu cầu duy nhất** thay thế cho toàn bộ checklist kiểm tra chi tiết truyền thống. Đặc điểm:

| Yếu tố | Quy định | Ghi chú |
|:---|:---|:---|
| Số lượng ảnh | Tối thiểu 1, khuyến nghị 4-6 | Tùy loại tài sản |
| Góc độ | Không quy định cụ thể | Tổng quan, dễ nhận diện |
| Chất lượng | Đủ nhận diện tài sản | Không yêu cầu chuyên nghiệp |
| Ánh sáng | Theo điều kiện thực tế | Không yêu cầu studio |
| Thiết bị | Điện thoại, máy ảnh bất kỳ | Linh hoạt |

Ảnh tiếp nhận đóng vai trò **bằng chứng trực quan duy nhất** về tình trạng tài sản tại thời điểm giao dịch, hỗ trợ giải quyết tranh chấp nếu có. Không yêu cầu mô tả bằng văn bản, không yêu cầu đánh giá điểm số, không yêu cầu xác nhận của khách hàng trên từng hạng mục.

#### 4.1.2 Lưu trữ hình ảnh vào hệ thống

Hình ảnh được lưu trữ với cơ chế **đơn giản và trực tiếp**:

| Thuộc tính | Giá trị | Lý do |
|:---|:---|:---|
| Tên file | `{ID_hợp_đồng}_{số_thứ_tự}.jpg` | Liên kết trực tiếp, dễ tìm kiếm |
| Định dạng | JPEG | Phổ biến, nén tốt |
| Mức nén | Trung bình (quality 70-85) | Cân bằng chất lượng/dung lượng |
| Kích thước | Gốc hoặc giảm 50% | Tùy khả năng lưu trữ |
| Metadata EXIF | Không lưu | Giảm dung lượng, tăng riêng tư |

Cấu trúc thư mục lưu trữ: `/storage/YYYY/MM/DD/{ID_hợp_đồng}/` hoặc `/storage/{loại_xe}/YYYY/MM/{ID_hợp_đồng}/`. Không yêu cầu **xử lý ảnh nâng cao** (resize, watermark, filter), không tạo **bản sao lưu tự động** trừ khi được cấu hình riêng.

#### 4.1.3 Không yêu cầu checklist chi tiết

Điểm đơn giản hóa **quan trọng nhất**: **loại bỏ hoàn toàn checklist chi tiết**. So sánh với quy trình truyền thống:

| Quy trình truyền thống | Quy trình đơn giản hóa | Tác động |
|:---|:---|:---|
| 20-50 mục kiểm tra | ❌ Không có | Giảm 90% thời gian nhập liệu |
| Đánh giá từng bộ phận | ❌ Không có | Không cần đào tạo chuyên sâu |
| Chấm điểm tình trạng | ❌ Không có | Loại bỏ subjectivity |
| Xác nhận khách hàng từng mục | ❌ Không có | Giảm ma sát giao dịch |
| Ghi chú vấn đề phát hiện | ❌ Không có | Tập trung vào ảnh làm bằng chứng |

Thời gian xử lý mỗi hợp đồng giảm từ **10-15 phút xuống còn 2-3 phút**, tăng đáng kể năng lực xử lý của hệ thống. Tuy nhiên, điều này cũng có nghĩa là **chấp nhận rủi ro cao hơn** về tranh chấp tình trạng tài sản - cần có **điều khoản hợp đồng rõ ràng** để bảo vệ quyền lợi.

### 4.2 Loại Bỏ Checklist Phức Tạp

#### 4.2.1 Không đánh giá tình trạng chi tiết

Hệ thống **không yêu cầu và không cung cấp cơ chế** để đánh giá tình trạng chi tiết. Các yếu tố sau **không được ghi nhận**:

- Mức độ hao mòn ngoại thất (sơn, gỉ, trầy xước)
- Tình trạng nội thất (ghế, táp-lô, thảm)
- Hoạt động của thiết bị điện (đèn, còi, điều hòa)
- Mức nhiên liệu
- Áp suất lốp
- Mức dầu máy
- Vết xước, móp méo cụ thể

Quyết định này dựa trên đánh giá rằng trong ngữ cảnh **cầm đồ xe cơ giới**, giá trị tài sản được xác định chủ yếu qua **giấy tờ pháp lý và định giá chuyên môn**, không phụ thuộc vào đánh giá tình trạng bề ngoại tại thời điểm tiếp nhận. Ảnh chụp được coi là **bằng chứng đủ để giải quyết hầu hết tranh chấp**.

#### 4.2.2 Không ghi nhận vấn đề liên quan

Mọi **vấn đề phát hiện** trong quá trình tiếp nhận đều **không được ghi nhận** trong hệ thống:

| Loại vấn đề | Ví dụ | Cách xử lý |
|:---|:---|:---|
| Kỹ thuật | Động cơ có tiếng lạ | Không ghi, chỉ chụp ảnh |
| Pháp lý | Giấy tờ không đầy đủ | Từ chối tiếp nhận, không log |
| Rủi ro tiềm ẩn | Xe có dấu hiệu tai nạn | Không ghi, quyết định nhân viên |
| Yêu cầu đặc biệt của khách | Giữ lại đồ cá nhân trong xe | Không ghi, thỏa thuận riêng |

Việc không ghi nhận vấn đề đặt ra **yêu cầu cao hơn về quy trình xử lý ngoại lệ** và **khung pháp lý của hợp đồng**. Các tình huống đặc biệt cần được xử lý thông qua **quy trình riêng**, không thông qua hệ thống log chuẩn.

#### 4.2.3 Chỉ xác nhận đã tiếp nhận và chụp ảnh

Thao tác duy nhất cần thực hiện: **xác nhận đã tiếp nhận tài sản và đã chụp ảnh**. Cơ chế xác nhận:

- **Nút bấm đơn giản** hoặc **checkbox** trong giao diện
- Tự động tạo log với timestamp, ID nhân viên, ID hợp đồng
- Không yêu cầu nhập thêm thông tin
- Không yêu cầu xác nhận của khách hàng trên hệ thống

Sự đơn giản này cho phép nhân viên **tập trung vào tương tác với khách hàng** thay vì thao tác hệ thống phức tạp, cải thiện trải nghiệm khách hàng và giảm căng thẳng công việc.

## 5. Kiểm Tra Định Kỳ Tài Sản Trong Kho

### 5.1 Mục Đích Kiểm Tra

#### 5.1.1 Xác nhận tài sản còn mặt trong kho

Mục đích **duy nhất** của kiểm tra định kỳ: **xác nhận tài sản vẫn còn trong kho**. Không có mục đích nào khác:

| Mục đích thường gặp | Trong hệ thống này | Lý do loại bỏ |
|:---|:---|:---|
| Đánh giá tình trạng hiện tại | ❌ Không | Tốn thời gian, không cần thiết |
| So sánh với tình trạng ban đầu | ❌ Không | Không có dữ liệu tham chiếu |
| Phát hiện hao mòn, hư hỏng | ❌ Không | Không ảnh hưởng giá trị cầm đồ |
| Kiểm tra bảo trì, bảo dưỡng | ❌ Không | Trách nhiệm chủ sở hữu |
| Xác minh giấy tờ đi kèm | ❌ Không | Kiểm tra riêng khi cần |

Việc kiểm tra được thực hiện bằng cách **quét mã QR** trên tài sản hoặc giấy cầm đồ, so khớp với danh sách tài sản đang lưu kho. Thời gian kiểm tra mỗi tài sản giảm từ **5-10 phút xuống còn 30 giây - 1 phút**.

#### 5.1.2 Không so sánh với dữ liệu ban đầu

Quyết định **không so sánh với dữ liệu kiểm tra ban đầu** là điểm đơn giản hóa then chốt. Hệ thống:

- **Không lưu trữ** thông tin tình trạng ban đầu để so sánh
- **Không yêu cầu** nhân viên ghi nhận tình trạng hiện tại
- **Không cảnh báo** khi phát hiện khác biệt
- **Không báo cáo** xu hướng hao mòn

Điều này có nghĩa là kiểm tra định kỳ chỉ là **"điểm danh"** đơn thuần - xác nhận tài sản còn đó, không quan tâm tình trạng. Rủi ro được chấp nhận: **không phát hiện được tài sản bị hư hỏng nghiêm trọng** trong quá trình lưu kho.

### 5.2 Thông Tin Ghi Nhận

#### 5.2.1 ID nhân viên kiểm tra

Tương tự như quy trình tiếp nhận, **ID nhân viên thực hiện kiểm tra** được ghi nhận bắt buộc. Điều này:

- Tạo trách nhiệm giải trình cho việc thực hiện kiểm tra
- Hỗ trợ phân tích phân bố công việc kiểm tra
- Phát hiện mẫu bất thường (nhân viên kiểm tra ít, bỏ sót tài sản)

#### 5.2.2 Ngày giờ kiểm tra

**Timestamp** của lần kiểm tra được ghi nhận chính xác, phục vụ:

- Lập lịch và theo dõi tần suất kiểm tra
- Đảm bảo tài sản được kiểm tra đều đặn theo quy định
- Phát hiện tài sản nào thường xuyên bị bỏ qua

#### 5.2.3 Tọa độ GPS location

**Tọa độ GPS** được thu thập tự động từ thiết bị di động của nhân viên kiểm tra:

| Thuộc tính | Giá trị | Ý nghĩa |
|:---|:---|:---|
| Vĩ độ (latitude) | Ví dụ: 10.762622 | Vị trí chính xác |
| Kinh độ (longitude) | Ví dụ: 106.660172 | Vị trí chính xác |
| Độ chính xác | Ví dụ: ±10m | Đánh giá độ tin cậy |
| Thời điểm thu thập | Cùng với timestamp | Đồng bộ thông tin |

GPS location đặc biệt quan trọng khi **kho tài sản có nhiều địa điểm** hoặc khi cần **xác minh nhân viên thực sự có mặt tại kho** (chống kiểm tra từ xa). Cần có **cơ chế xử lý khi GPS không khả dụng**: cho phép nhập thủ công với xác nhận của quản lý.

### 5.3 Loại Bỏ So Sánh Chi Tiết

#### 5.3.1 Không đối chiếu tình trạng ban đầu

Hệ thống **không lưu trữ hoặc sử dụng** thông tin chi tiết về tình trạng tài sản tại thời điểm tiếp nhận để đối chiếu. Mọi thay đổi về tình trạng, dù có thể quan sát được, cũng **không được ghi nhận hoặc so sánh**.

#### 5.3.2 Không đánh giá hao mòn

**Không có cơ chế đánh giá hao mòn** trong quy trình kiểm tra định kỳ:

- Không chấm điểm tình trạng
- Không ước tính giá trị còn lại
- Không so sánh với tiêu chuẩn
- Không dự báo tuổi thọ còn lại

#### 5.3.3 Chỉ xác nhận sự hiện diện

Kết quả kiểm tra định kỳ chỉ có **hai trạng thái**:

| Kết quả | Ý nghĩa | Hành động tiếp theo |
|:---|:---|:---|
| **Có mặt** | Tài sản còn trong kho | Ghi log, kết thúc kiểm tra |
| **Không có mặt** | Tài sản không tìm thấy | Báo động, kích hoạt quy trình tìm kiếm |

Không có trạng thái trung gian như "có mặt nhưng hư hỏng", "có mặt nhưng cần bảo dưỡng", v.v.

## 6. Loại Bỏ Các Chức Năng Không Cần Thiết

### 6.1 Hệ Thống Hoa Hồng

#### 6.1.1 Không tính hoa hồng cho nhân viên

Hệ thống **không triển khai** bất kỳ cơ chế tính hoa hồng nào:

| Chức năng thường gặp | Trong hệ thống này |
|:---|:---|
| Tính hoa hồng theo doanh số | ❌ Không có |
| Tính hoa hồng theo số lượng hợp đồng | ❌ Không có |
| Tính hoa hồng theo giá trị tài sản | ❌ Không có |
| Phân chia hoa hồng nhóm | ❌ Không có |
| Thưởng theo mốc doanh số | ❌ Không có |

Quyết định này dựa trên mô hình **lương cố định** hoặc **thưởng theo quyết định quản lý**, không theo công thức tự động. Lợi ích: **giảm 70-80% độ phức tạp của module tính lương**, loại bỏ tranh chấp về công thức, và tập trung vào chất lượng dịch vụ thay vì số lượng.

#### 6.1.2 Không theo dõi doanh số cá nhân

Hệ thống **không lưu trữ hoặc báo cáo** doanh số theo cá nhân nhân viên:

- Không đếm số hợp đồng tạo bởi mỗi nhân viên
- Không tính tổng giá trị tài sản tiếp nhận
- Không xếp hạng nhân viên theo hiệu suất
- Không so sánh giữa các nhân viên

Thông tin này vẫn có thể truy xuất từ **log thô** nếu thực sự cần, nhưng không được tổng hợp và trình bày dưới dạng báo cáo.

### 6.2 Hệ Thống KPI

#### 6.2.1 Không đặt chỉ tiêu hiệu suất

Hệ thống **không hỗ trợ đặt KPI** cho bất kỳ cấp độ nào:

| Loại KPI thường gặp | Trong hệ thống này |
|:---|:---|
| KPI số lượng hợp đồng/ngày | ❌ Không có |
| KPI giá trị tài sản tiếp nhận | ❌ Không có |
| KPI thời gian xử lý hợp đồng | ❌ Không có |
| KPI tỷ lệ chuộc đúng hạn | ❌ Không có |
| KPI tỷ lệ tài sản bán thanh lý | ❌ Không có |

#### 6.2.2 Không đánh giá theo KPI

Không có cơ chế **đánh giá định kỳ** dựa trên KPI:

- Không đánh giá hàng tháng/quý/năm theo số liệu
- Không cảnh báo khi không đạt KPI
- Không khen thưởng/phạt dựa trên KPI
- Không điều chỉnh mục tiêu KPI động

Quản lý hiệu suất được thực hiện thông qua **quan sát trực tiếp, phản hồi khách hàng, và đánh giá định tính** thay vì số liệu.

### 6.3 Báo Cáo Năng Suất

#### 6.3.1 Không báo cáo theo ca

Hệ thống **không tạo báo cáo tổng kết theo ca làm việc**:

- Không đếm số hợp đồng ca sáng/chiều/tối
- Không so sánh hiệu suất giữa các ca
- Không phân tích xu hướng theo giờ trong ngày

#### 6.3.2 Không báo cáo theo ngày

Hệ thống **không tạo báo cáo tổng kết hàng ngày**:

- Không tổng hợp số lượng hợp đồng trong ngày
- Không tính tổng giá trị tài sản tiếp nhận
- Không so sánh với ngày trước đó
- Không dự báo xu hướng

#### 6.3.3 Không báo cáo theo tháng

Hệ thống **không tạo báo cáo tổng kết hàng tháng**:

- Không tổng hợp doanh số tháng
- Không phân tích theo loại tài sản, loại hợp đồng
- Không so sánh với tháng trước, cùng kỳ năm trước
- Không tạo biểu đồ, đồ thị xu hướng

**Dữ liệu thô vẫn được lưu trữ** và có thể được truy xuất thủ công hoặc qua công cụ phân tích bên ngoài nếu cần, nhưng **không có báo cáo tự động** được tạo ra từ hệ thống.

## 7. Tích Hợp Kỹ Thuật

### 7.1 Thư Viện Tạo QR Code

#### 7.1.1 Sử dụng qrcode hoặc Segno trong Python

Hệ thống có thể sử dụng một trong các thư viện Python phổ biến để tạo QR code:

| Thư viện | Phiên bản | Ưu điểm | Nhược điểm |
|:---|:---|:---|:---|
| **qrcode** | 7.4+ | Phổ biến, tài liệu đầy đủ, hỗ trợ PIL | Phụ thuộc Pillow, kích thước lớn hơn |
| **Segno** | 1.6+ | Nhẹ, không phụ thuộc, nhiều định dạng đầu ra | Ít phổ biến hơn, tài liệu ít hơn |
| **pyqrcode** | 1.2+ | Đơn giản, pure Python | Ít tính năng nâng cao |

Ví dụ sử dụng `qrcode`:

```python
import qrcode

def create_qr_image(qr_data, filename):
    qr = qrcode.QRCode(
        version=1,  # Kích thước tự động
        error_correction=qrcode.constants.ERROR_CORRECT_M,  # ~15% sửa lỗi
        box_size=10,  # Kích thước mỗi ô
        border=4,  # Độ rộng viền
    )
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(filename)
    return filename
```

#### 7.1.2 Tích hợp với Flask API để tạo mã động

Cấu trúc API đơn giản để tạo mã QR động:

```python
from flask import Flask, request, send_file
import qrcode
import io

app = Flask(__name__)

@app.route('/generate-qr', methods=['POST'])
def generate_qr():
    data = request.json
    vehicle_type = data['vehicle_type']      # "CAR"
    contract_type = data['contract_type']    # "RENTAL"
    sequence = get_next_sequence()           # Từ hệ thống đếm
    
    qr_data = f"{vehicle_type}-{contract_type}-{get_today()}-{sequence:02d}"
    
    # Tạo QR image
    qr = qrcode.make(qr_data)
    img_io = io.BytesIO()
    qr.save(img_io, 'PNG')
    img_io.seek(0)
    
    return send_file(img_io, mimetype='image/png')
```

#### 7.1.3 Lưu trữ hình ảnh QR code

Hình ảnh QR code được lưu trữ với **cấu trúc đơn giản**:

| Phương án | Đường dẫn | Kích thước ước tính |
|:---|:---|:---|
| Lưu cục bộ | `/qr_codes/YYYY/MM/DD/{ID_hợp_đồng}.png` | ~2-5 KB/file |
| Cloud storage | S3/GCS: `bucket/qr-codes/YYYY/MM/DD/{ID}.png` | Chi phí ~$0.023/GB/tháng |
| Database (BLOB) | Không khuyến nghị | Làm phình CSDL |

### 7.2 Xử Lý Ngày Tháng

#### 7.2.1 Sử dụng datetime module

Module `datetime` của Python là công cụ chính để xử lý ngày tháng:

```python
from datetime import datetime, timezone

def get_today():
    """Trả về ngày hiện tại định dạng YYYYMMDD"""
    return datetime.now(timezone.utc).strftime("%Y%m%d")

def get_current_datetime_iso():
    """Trả về timestamp ISO 8601 với múi giờ"""
    return datetime.now(timezone.utc).isoformat()
```

#### 7.2.2 Định dạng YYYYMMDD cho mã QR

Chuyển đổi giữa các định dạng:

| Định dạng nguồn | Hàm chuyển đổi | Kết quả |
|:---|:---|:---|
| datetime object | `dt.strftime("%Y%m%d")` | "20260206" |
| String YYYY-MM-DD | `datetime.strptime(s, "%Y-%m-%d").strftime("%Y%m%d")` | "20260206" |
| Timestamp | `datetime.fromtimestamp(ts).strftime("%Y%m%d")` | "20260206" |

#### 7.2.3 Quản lý reset số thứ tự theo ngày

Triển khai đầy đủ của cơ chế đếm và reset:

```python
import os
from datetime import datetime

COUNTER_FILE = "contract_counter.txt"

def get_next_sequence():
    today = datetime.now().strftime("%Y%m%d")
    
    # Đọc trạng thái hiện tại
    if os.path.exists(COUNTER_FILE):
        with open(COUNTER_FILE, 'r') as f:
            saved_date, current_seq = f.read().strip().split(',')
            current_seq = int(current_seq)
    else:
        saved_date, current_seq = "00000000", 0
    
    # Quyết định tăng hay reset
    if today != saved_date:
        new_seq = 1
    else:
        new_seq = current_seq + 1
    
    # Lưu trạng thái mới (atomic write)
    temp_file = COUNTER_FILE + ".tmp"
    with open(temp_file, 'w') as f:
        f.write(f"{today},{new_seq}")
    os.replace(temp_file, COUNTER_FILE)
    
    return new_seq
```

### 7.3 Lưu Trữ Dữ Liệu

#### 7.3.1 Lưu hình ảnh tài sản

Cấu hình lưu trữ hình ảnh tài sản:

| Thông số | Giá trị khuyến nghị | Lý do |
|:---|:---|:---|
| Định dạng | JPEG, quality 75-85 | Cân bằng chất lượng/dung lượng |
| Kích thước tối đa | 1920x1080 hoặc 2560x1440 | Đủ chi tiết, không quá lớn |
| Dung lượng ước tính | 100-500 KB/ảnh | Tùy độ phức tạp cảnh |
| Số ảnh/hợp đồng | 4-6 ảnh | Đủ góc độ, không dư thừa |
| Tổng dung lượng/hợp đồng | 0.5-3 MB | Dễ quản lý, backup nhanh |

#### 7.3.2 Lưu log kiểm tra với GPS

Cấu trúc bản ghi log kiểm tra định kỳ:

```json
{
    "timestamp": "2026-02-06T14:30:00+07:00",
    "staff_id": "NV001",
    "contract_id": "CAR-RENTAL-20260206-01",
    "gps_location": {
        "latitude": 10.762622,
        "longitude": 106.660172,
        "accuracy": 10.5
    },
    "result": "PRESENT"
}
```

Lưu trữ: **file JSON Lines** (`logs/inspection_YYYY_MM.jsonl`) hoặc **SQLite đơn giản** cho khả năng truy vấn cơ bản.

#### 7.3.3 Đồng bộ biến đếm hợp đồng

Trong môi trường **đa máy chủ**, cần cơ chế đồng bộ biến đếm:

| Phương án | Triển khai | Độ phức tạp | Độ tin cậy |
|:---|:---|:---|:---|
| Database sequence | `CREATE SEQUENCE contract_seq` | Thấp | Cao |
| Redis INCR | `INCR contract:counter:{date}` | Trung bình | Cao |
| Distributed lock | File lock / ZooKeeper | Cao | Rất cao |
| UUID fallback | Dùng UUID khi không kết nối | Thấp | Trung bình |

Khuyến nghị cho hệ thống vừa và nhỏ: **Database sequence** hoặc **Redis** để cân bằng giữa đơn giản và độ tin cậy.

